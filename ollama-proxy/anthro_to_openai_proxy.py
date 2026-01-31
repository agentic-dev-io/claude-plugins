# anthro_to_openai_proxy.py
#
# FastAPI-Proxy:
# - nimmt Anthropic /v1/messages Requests entgegen (Claude Code kompatibel)
# - mappt sie auf OpenAI-/Ollama-Chat-Completions
# - gibt eine Anthropic-kompatible Response zurück

from fastapi import FastAPI, Request
from typing import List, Optional, Any, Dict, Union
import httpx
import os
import uuid

# ---------------------------------------------------------
# Konfiguration
# ---------------------------------------------------------

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY", "ollama")

# Model-Mapping: Claude-Namen -> lokale Ollama Modelle
DEFAULT_MODEL_MAP = {
    # Claude Code Modelle -> lokale Ollama Aliase
    "claude-sonnet-4-5-20250514": "claude-sonet-4-5:latest",
    "claude-opus-4-5-20251101": "claude-opus-4-5:latest",
    "claude-haiku-4-5-20250514": "claude-haiku-4-5:latest",
    "claude-sonnet-4-5": "claude-sonet-4-5:latest",
    "claude-opus-4-5": "claude-opus-4-5:latest",
    "claude-haiku-4-5": "claude-haiku-4-5:latest",
    "claude-3-5-sonnet-latest": "claude-sonet-4-5:latest",
    "claude-3-5-haiku-latest": "claude-haiku-4-5:latest",
    "claude-3-opus-latest": "claude-opus-4-5:latest",
}

# ---------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------

app = FastAPI(title="Anthropic -> Ollama Proxy")

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "anthropic-to-ollama-proxy",
        "ollama_url": OLLAMA_BASE_URL,
        "available_models": len(DEFAULT_MODEL_MAP)
    }

@app.get("/v1/models")
async def list_models():
    return {
        "data": [
            {"id": model_name, "object": "model", "created": 0, "owned_by": "ollama"}
            for model_name in DEFAULT_MODEL_MAP.keys()
        ]
    }

# ---------------------------------------------------------
# Helper
# ---------------------------------------------------------

def map_model(anthropic_model: str) -> str:
    return DEFAULT_MODEL_MAP.get(anthropic_model, anthropic_model)

def extract_text_from_content(content: Any) -> str:
    """Extract text from various content formats."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        texts = []
        for item in content:
            if isinstance(item, str):
                texts.append(item)
            elif isinstance(item, dict):
                if item.get("type") == "text":
                    texts.append(item.get("text", ""))
                elif "text" in item:
                    texts.append(item["text"])
        return "\n".join(texts)
    return str(content)

def anthropic_messages_to_openai(messages: List[Dict[str, Any]], system: Optional[str] = None) -> List[Dict[str, Any]]:
    """Convert Anthropic messages to OpenAI format."""
    out = []

    # Add system message if present
    if system:
        out.append({"role": "system", "content": system})

    for m in messages:
        role = m.get("role", "user")
        content = extract_text_from_content(m.get("content", ""))
        out.append({"role": role, "content": content})

    return out

# ---------------------------------------------------------
# Main endpoint: /v1/messages
# ---------------------------------------------------------

@app.post("/v1/messages")
async def handle_messages(request: Request):
    """Handle Anthropic /v1/messages requests."""
    try:
        body = await request.json()
    except Exception as e:
        return {"error": {"type": "invalid_request_error", "message": f"Invalid JSON: {e}"}}, 400

    # Extract fields from request
    model = body.get("model", "claude-haiku-4-5")
    messages = body.get("messages", [])
    system = body.get("system")
    max_tokens = body.get("max_tokens", 4096)
    temperature = body.get("temperature", 0.7)
    stream = body.get("stream", False)

    # Map model and convert messages
    target_model = map_model(model)
    openai_messages = anthropic_messages_to_openai(messages, system)

    payload = {
        "model": target_model,
        "messages": openai_messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False,  # TODO: implement streaming
    }

    headers = {
        "Authorization": f"Bearer {OLLAMA_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{OLLAMA_BASE_URL}/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        return {
            "type": "error",
            "error": {"type": "api_error", "message": f"Ollama error: {e.response.status_code} - {e.response.text}"}
        }
    except Exception as e:
        return {
            "type": "error",
            "error": {"type": "api_error", "message": f"Connection error: {str(e)}"}
        }

    # Extract response text
    text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    message_id = f"msg_{uuid.uuid4().hex[:24]}"

    # Return Anthropic-compatible response
    return {
        "id": message_id,
        "type": "message",
        "role": "assistant",
        "model": model,
        "content": [{"type": "text", "text": text}],
        "stop_reason": "end_turn",
        "stop_sequence": None,
        "usage": {
            "input_tokens": data.get("usage", {}).get("prompt_tokens", 0),
            "output_tokens": data.get("usage", {}).get("completion_tokens", 0),
        }
    }

# Catch-all for other endpoints
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def catch_all(path: str, request: Request):
    return {"error": f"Endpoint /{path} not implemented", "hint": "Use /v1/messages"}
