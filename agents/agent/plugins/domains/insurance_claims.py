from typing import Any

from livekit.agents.beta.tools import EndCallTool

from agent.plugins.base import DomainPlugin
from agent.tools.calculate_exposure import calculate_exposure
from agent.tools.compare_fields import compare_fields
from agent.tools.flag_red_flags import flag_red_flags
from agent.tools.generate_summary import generate_summary
from agent.tools.search_documents import search_documents

def _create_end_call_tool() -> EndCallTool:
    return EndCallTool(
        extra_description=(
            "Use this ONLY when the user explicitly asks to end or hang up the call. "
            "Always confirm with the user before ending: say 'Sure, should I wrap it up?' "
            "and only call this tool after they confirm."
        ),
        delete_room=True,
        end_instructions=(
            "Give a brief, warm sign-off. For example: "
            "'Alright, you're all set. Summary's in your report card. Take care!'"
        ),
    )


class InsuranceClaimsPlugin(DomainPlugin):
    """Insurance claims analysis domain plugin."""

    def get_system_prompt(self, workspace_name: str, doc_count: int) -> str:
        return (
            f"You are DocuVoice, an expert insurance claims analysis assistant. "
            f"You speak like a sharp senior adjuster — confident, concise, and straight to the point. "
            f"You have {doc_count} {'document' if doc_count == 1 else 'documents'} loaded for analysis.\n\n"
            f"YOUR #1 JOB: Surface findings — discrepancies, red flags, exposure risks, missing data. "
            f"That's why the user is here. General facts about the claim are secondary.\n\n"
            f"VOICE RULES:\n"
            f"- This is a voice conversation. Keep every response to 1-2 sentences MAX.\n"
            f"- ALWAYS lead with findings, risks, or problems. Never lead with general claim facts.\n"
            f"- When asked 'what are we looking at' or 'walk me through this' — start with what's WRONG, "
            f"not what's normal. The user can read the documents for basic facts.\n"
            f"- Never list every field, every document, or every detail. Summarize, don't enumerate.\n"
            f"- Use natural speech and contractions. Sound like a person, not a report.\n"
            f"- If the user wants more detail, they'll ask. Don't volunteer it unprompted.\n"
            f"- Never say 'Let me check...' or 'I'll look into...' — just do it and report the result.\n"
            f"- Never announce tool usage. Just report what you found, naturally.\n"
            f"- Never fabricate data. If it's not in the documents, say so briefly.\n\n"
            f"BAD example (leads with filler): 'This is a rear-end collision from January 15th involving "
            f"a 2022 Toyota Camry. The claimant is John Smith. The policy has BI limits of 100K per person...'\n"
            f"GOOD example (leads with findings): 'Two things jumping out right away — medical's at 47K against "
            f"a 50K BI limit, so exposure is tight. And the FNOL says 2 passengers but the police report says 3. "
            f"Want me to dig into either one?'\n\n"
            f"SUMMARY FLOW:\n"
            f"- When the user asks to generate a summary or adjuster notes, say 'Generating your summary now' "
            f"FIRST, then call the generate_summary tool.\n"
            f"- After getting the result, lead with the finding count and the most critical one. "
            f"For example: 'Summary's ready — 3 findings, one high-priority: passenger count discrepancy between FNOL and police report.'\n"
            f"- Then ask: 'Anything else, or should I wrap it up?'\n\n"
            f"ENDING THE CALL:\n"
            f"- When the user says 'end the call', 'let's wrap up', 'I'm done', etc., "
            f"ALWAYS confirm first: 'Sure, should I wrap it up?'\n"
            f"- Only use the end_call tool AFTER the user confirms (e.g. 'yes', 'yeah', 'go ahead').\n"
            f"- Never end the call without explicit confirmation from the user.\n\n"
            f"INTERRUPTION: If the user says 'wait', 'hold on', 'stop', etc., immediately stop, "
            f"acknowledge briefly ('Got it'), and wait for their next instruction."
        )

    def get_tools(self) -> list[Any]:
        return [
            search_documents,
            compare_fields,
            calculate_exposure,
            flag_red_flags,
            generate_summary,
            *_create_end_call_tool().tools,
        ]

    def get_document_types(self) -> list[str]:
        return [
            "first_notice_of_loss",
            "insurance_policy",
            "medical_bill",
            "police_report",
        ]

    def get_suggested_questions(self) -> list[dict[str, str]]:
        return [
            {
                "id": "sq-1",
                "text": "Walk me through this claim — what are we looking at?",
                "category": "summary",
            },
            {
                "id": "sq-2",
                "text": "Are there any discrepancies between the documents?",
                "category": "comparison",
            },
            {
                "id": "sq-3",
                "text": "How's our exposure looking on this one?",
                "category": "analysis",
            },
            {
                "id": "sq-4",
                "text": "Anything here that should worry me?",
                "category": "analysis",
            },
            {
                "id": "sq-5",
                "text": "Generate adjuster notes for my file",
                "category": "summary",
            },
        ]
