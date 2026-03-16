import json
import logging

from livekit import api

from app.config import settings

logger = logging.getLogger(__name__)


class LiveKitService:
    async def generate_token(
        self,
        workspace_id: str,
        participant_name: str = "user",
        workspace_name: str = "",
        domain: str = "insurance_claims",
    ) -> tuple[str, str]:
        """Generate a LiveKit participant token.

        Pre-creates the room with workspace metadata so the agent can read
        domain/workspace context from ctx.room.metadata on dispatch.

        Returns:
            Tuple of (token, server_url)
        """
        room_metadata = json.dumps({
            "workspace_id": workspace_id,
            "workspace_name": workspace_name or workspace_id,
            "domain": domain,
        })

        # 1. Generate JWT token (CPU-only, no network)
        token = (
            api.AccessToken(
                api_key=settings.livekit_api_key,
                api_secret=settings.livekit_api_secret,
            )
            .with_identity(participant_name)
            .with_name(participant_name)
            .with_metadata(room_metadata)
            .with_grants(
                api.VideoGrants(
                    room_join=True,
                    room=workspace_id,
                    can_publish=True,
                    can_subscribe=True,
                )
            )
            .to_jwt()
        )

        # 2. Create room (must exist before dispatch) — idempotent
        async with api.LiveKitAPI(
            url=settings.livekit_url,
            api_key=settings.livekit_api_key,
            api_secret=settings.livekit_api_secret,
        ) as lk:
            try:
                await lk.room.create_room(
                    api.CreateRoomRequest(
                        name=workspace_id,
                        metadata=room_metadata,
                    )
                )
            except Exception:
                pass

        return token, settings.livekit_url

    async def dispatch_agent(
        self,
        workspace_id: str,
        workspace_name: str = "",
        domain: str = "insurance_claims",
    ) -> None:
        """Explicitly dispatch the voice agent into a room.

        Called once by the frontend after session.start() succeeds.
        """
        room_metadata = json.dumps({
            "workspace_id": workspace_id,
            "workspace_name": workspace_name or workspace_id,
            "domain": domain,
        })

        try:
            async with api.LiveKitAPI(
                url=settings.livekit_url,
                api_key=settings.livekit_api_key,
                api_secret=settings.livekit_api_secret,
            ) as lk:
                await lk.agent_dispatch.create_dispatch(
                    api.CreateAgentDispatchRequest(
                        agent_name="docuvoice-agent",
                        room=workspace_id,
                        metadata=room_metadata,
                    )
                )
        except Exception:
            logger.warning("agent_dispatch_failed", extra={"workspace_id": workspace_id})
            raise
