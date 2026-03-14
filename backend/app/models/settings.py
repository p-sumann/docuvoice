from dataclasses import dataclass, field


@dataclass
class ModelConfig:
    temperature: float = 0.7
    tonality: str = "professional"
    system_prompt: str = ""
    persona: str = "DocuVoice Assistant"
    max_tokens: int = 4096
