from typing import Literal
from pydantic import BaseModel, Field

class Evidence(BaseModel):
    id: str
    detail: str

class StructuredAgentOutput(BaseModel):
    summary: str
    confidence: float = Field(ge=0, le=1)
    uncertainty: str
    evidence: list[Evidence]
    requires_human_review: bool = False
    status: Literal['completed', 'fallback', 'waiting_for_approval', 'requires_review', 'queued_offline']
