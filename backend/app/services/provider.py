import os
from typing import Any

class ProviderUnavailable(RuntimeError):
    pass

class ModelProvider:
    def __init__(self) -> None:
        self.provider = os.getenv('LLMPROVIDER', '')
        self.model = os.getenv('LLMMODEL', '')
        self.api_key = os.getenv('LLMAPIKEY', '')

    @property
    def configured(self) -> bool:
        return bool(self.provider and self.model and self.api_key)

    def structured_call(self, prompt: str, schema: dict[str, Any]) -> dict[str, Any]:
        if not self.configured:
            raise ProviderUnavailable('No model provider configured')
        # The production connector belongs here; the MVP never fabricates a live model result.
        raise ProviderUnavailable('Provider adapter not enabled in demo environment')
