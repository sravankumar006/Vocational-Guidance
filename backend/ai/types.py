"""Provider-independent AI data types and request/response models.

These types define the vendor-neutral contract between the application
domain and the AI provider abstraction. Under no circumstances should
vendor-specific concepts (e.g., Gemini Content/Parts, Anthropic Blocks,
or OpenAI ChatCompletion) be defined here.
"""

from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field


class AIRole(str, Enum):
    """Normalized role identifier for conversational messages."""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    FUNCTION = "function"


class AIMessage(BaseModel):
    """Represents a single message in a conversation sequence."""
    role: Union[AIRole, str]
    content: str
    name: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(extra="ignore")


class AIResponse(BaseModel):
    """Normalized text response from an AI provider."""
    content: str
    role: str = "assistant"
    model: Optional[str] = None
    finish_reason: Optional[str] = None
    usage: Optional[Dict[str, int]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(extra="ignore")


class AIStreamChunk(BaseModel):
    """A single incremental chunk yielded during streaming inference."""
    content: str
    index: int = 0
    is_final: bool = False
    finish_reason: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(extra="ignore")


class AIRequest(BaseModel):
    """Encapsulates a standard text generation request."""
    messages: List[AIMessage]
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None
    extra_params: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(extra="ignore")


class StructuredResponseRequest(BaseModel):
    """Encapsulates a structured response request with a target schema."""
    messages: List[AIMessage]
    response_schema: Any = Field(
        ...,
        description="Pydantic model class or JSON Schema dictionary defining expected output.",
    )
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    extra_params: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(arbitrary_types_allowed=True, extra="ignore")


class StructuredAIResponse(BaseModel):
    """Normalized structured output from an AI provider."""
    parsed: Any = Field(
        ...,
        description="The validated structured data (e.g. Pydantic model instance or dict).",
    )
    raw_content: str
    model: Optional[str] = None
    finish_reason: Optional[str] = None
    usage: Optional[Dict[str, int]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(arbitrary_types_allowed=True, extra="ignore")
