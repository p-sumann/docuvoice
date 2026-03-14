from dataclasses import asdict

from app.models.settings import ModelConfig


class SettingsService:
    def __init__(self) -> None:
        self._model_config = ModelConfig()

    async def get_model_config(self) -> ModelConfig:
        return self._model_config

    async def update_model_config(self, updates: dict) -> ModelConfig:
        current = asdict(self._model_config)
        for key, value in updates.items():
            if key in current and value is not None:
                current[key] = value
        self._model_config = ModelConfig(**current)
        return self._model_config
