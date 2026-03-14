import structlog

from agent.plugins.base import DomainPlugin
from agent.plugins.domains.insurance_claims import InsuranceClaimsPlugin

logger = structlog.get_logger(__name__)

_REGISTRY: dict[str, type[DomainPlugin]] = {
    "insurance_claims": InsuranceClaimsPlugin,
}


def resolve_plugin(domain_type: str) -> DomainPlugin:
    """Resolve domain type string to plugin instance."""
    plugin_cls = _REGISTRY.get(domain_type)
    if plugin_cls is None:
        logger.warning(
            "unknown_domain_type_falling_back",
            domain_type=domain_type,
            fallback="insurance_claims",
        )
        return InsuranceClaimsPlugin()
    return plugin_cls()
