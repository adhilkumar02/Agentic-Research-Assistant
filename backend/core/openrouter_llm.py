import os
from openai import OpenAI

_client = None

# Allow model override via environment variable so you can switch without code changes.
# e.g.  set OPENROUTER_MODEL=anthropic/claude-3-haiku
DEFAULT_MODEL = "openai/gpt-4o-mini"


from fastapi import HTTPException

def get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if api_key:
            api_key = api_key.strip('"\'')
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY environment variable is not set. Please set it and restart the server.")

        _client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )

    return _client


def openrouter_llm(prompt: str) -> str:
    """
    Send a prompt to OpenRouter and return the model response as a string.

    Model is resolved from OPENROUTER_MODEL env var (default: openai/gpt-4o-mini).
    Alternatives you can set via env:
        anthropic/claude-3-haiku
        mistralai/mistral-7b-instruct
        google/gemini-flash-1.5
    """
    client = get_client()
    model = os.getenv("OPENROUTER_MODEL", DEFAULT_MODEL)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a precise research assistant."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        extra_headers={
            "HTTP-Referer": "http://localhost",
            "X-Title": "Agentic Research Assistant",
        },
    )

    return response.choices[0].message.content.strip()
