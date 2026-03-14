import asyncio
import json
import logging
import re
import sys
import uuid

import structlog
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentServer, AgentSession, JobProcess, MetricsCollectedEvent, cli, metrics
from livekit.agents.voice import Agent
from livekit.plugins import aws, silero

from agent.config import get_settings
from agent.context.builder import load_workspace_context
from agent.context.session_memory import SessionMemory
from agent.plugins.registry import resolve_plugin
from agent.utils.dynamo import create_session, update_session_end
from agent.utils.metrics import SessionMetrics

load_dotenv()

# Configure structured logging — JSON for production, console for dev
_settings = get_settings()
_is_production = _settings.app_env != "development"

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer() if _is_production else structlog.dev.ConsoleRenderer(),
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logging.getLogger("botocore").setLevel(logging.WARNING)
logging.getLogger("boto3").setLevel(logging.WARNING)

logger = structlog.get_logger(__name__)

server = AgentServer(num_idle_processes=1)


def prewarm(proc: JobProcess) -> None:
    """Prewarm: load Silero VAD model once, reuse across sessions."""
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


async def _record_session_start(workspace_id: str, session_id: str) -> None:
    """Best-effort DynamoDB write — runs as a background task."""
    try:
        await create_session(workspace_id, session_id, channel="web")
    except Exception:
        logger.warning("session_record_failed", session_id=session_id)


@server.rtc_session(agent_name="docuvoice-agent")
async def entrypoint(ctx: agents.JobContext) -> None:
    settings = get_settings()
    session_metrics = SessionMetrics()

    # 1. Extract workspace_id from room name (backend sets room=workspace_id)
    workspace_id = ctx.room.name
    if not workspace_id:
        logger.error("no_workspace_id", room=ctx.room.name)
        return

    # Try room metadata for additional info
    room_metadata: dict = {}
    if ctx.room.metadata:
        try:
            room_metadata = json.loads(ctx.room.metadata)
        except json.JSONDecodeError:
            pass

    domain_type = room_metadata.get("domain", "insurance_claims")
    workspace_name = room_metadata.get("workspace_name", workspace_id)

    logger.info(
        "session_starting",
        workspace_id=workspace_id,
        domain=domain_type,
        room=ctx.room.name,
    )

    # 2. Resolve domain plugin
    plugin = resolve_plugin(domain_type)

    # 3. Load workspace context (two-tier: lean for LLM, full for tools)
    workspace_context = await load_workspace_context(workspace_id)
    lean_context = workspace_context.lean_context
    full_context = workspace_context.full_context
    doc_count = lean_context.count("=== DOCUMENT") if lean_context else 0

    # 4. Create session memory
    session_id = f"sess-{uuid.uuid4().hex[:8]}"
    memory = SessionMemory(
        workspace_id=workspace_id,
        session_id=session_id,
        workspace_name=workspace_name,
        domain_type=domain_type,
        context_text=lean_context,
        full_context_text=full_context,
    )

    # 5. Build the agent with plugin instructions and tools
    system_prompt = plugin.get_system_prompt(workspace_name=workspace_name, doc_count=doc_count)
    tools = plugin.get_tools()

    class DocuVoiceAgent(Agent):
        def __init__(self) -> None:
            super().__init__(
                instructions=system_prompt,
                tools=tools,
            )

        async def on_enter(self) -> None:
            """Called when the agent enters the session. Injects lean context and greets user."""
            if doc_count > 0:
                # Extract doc type names from lean context for a natural greeting
                doc_types = re.findall(r"Type:\s*(\S+)", lean_context)
                type_labels = {
                    "first_notice_of_loss": "FNOL",
                    "insurance_policy": "policy",
                    "medical_bill": "medical bills",
                    "police_report": "police report",
                }
                friendly_types = [type_labels.get(t, t.replace("_", " ")) for t in doc_types]
                types_str = ", ".join(dict.fromkeys(friendly_types))  # dedupe, preserve order

                greeting_instructions = (
                    f"DOCUMENT CONTEXT (reference this to answer questions):\n\n"
                    f"{lean_context}\n\n"
                    f"---\n"
                    f"Greet the adjuster casually and get straight to business. "
                    f"You have {doc_count} documents loaded: {types_str}. "
                    f"Mention what you have and offer to dive in — 'Where do you want to start?' "
                    f"or 'Want me to run through the red flags first?'\n"
                    f"Keep it to 2 sentences max. Sound like a colleague, not a chatbot."
                )
            else:
                greeting_instructions = (
                    "Greet the adjuster briefly. Let them know you don't have any documents "
                    "loaded yet for this workspace. Ask them to upload documents through the "
                    "app so you can start analyzing. Keep it to 1-2 sentences."
                )
            await self.session.generate_reply(instructions=greeting_instructions)

    # 6. Create the agent session with Nova Sonic 2
    vad_instance: silero.VAD = ctx.proc.userdata["vad"]

    session = AgentSession[SessionMemory](
        userdata=memory,
        llm=aws.realtime.RealtimeModel.with_nova_sonic_2(
            voice=settings.nova_sonic_voice,
            turn_detection=settings.nova_sonic_turn_detection,
        ),
        vad=vad_instance,
        max_tool_steps=settings.max_tool_steps,
    )

    # 7. Subscribe to built-in metrics (latency, tokens, usage)
    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent) -> None:
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    # 8. Record session start in DynamoDB (best-effort, fire-and-forget)
    asyncio.create_task(_record_session_start(workspace_id, session_id))

    # 9. Register shutdown callback
    async def on_shutdown() -> None:
        summary = usage_collector.get_summary()
        logger.info("session_usage_summary", session_id=session_id, usage=str(summary))
        duration = session_metrics.elapsed_seconds
        session_metrics.log_summary(session_id)
        try:
            await update_session_end(
                workspace_id=workspace_id,
                session_id=session_id,
                duration=duration,
                finding_count=len(memory.findings),
            )
        except Exception:
            logger.warning("session_end_record_failed", session_id=session_id)
        logger.info("session_ended", session_id=session_id, workspace_id=workspace_id, duration=duration, findings=len(memory.findings))

    ctx.add_shutdown_callback(on_shutdown)

    # 9. Start the session
    await session.start(
        room=ctx.room,
        agent=DocuVoiceAgent(),
        room_input_options=agents.RoomInputOptions(
            close_on_disconnect=True,
            delete_room_on_close=True,
        ),
    )

    logger.info(
        "session_started",
        session_id=session_id,
        workspace_id=workspace_id,
        doc_count=doc_count,
    )


def main() -> None:
    cli.run_app(server)


if __name__ == "__main__":
    main()
