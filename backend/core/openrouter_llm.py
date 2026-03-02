import os
from openai import OpenAI

_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise RuntimeError("OPENROUTER_API_KEY not set")

        _client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )

    return _client


def openrouter_llm(prompt: str) -> str:
    """
    Send prompt to OpenRouter and return model response.
    """
    client = get_client()

    response = client.chat.completions.create(
        model="openai/gpt-4o-mini",  
        # alternatives you can switch to:
        # "anthropic/claude-3-haiku"
        # "mistralai/mistral-7b-instruct"
        # "google/gemini-flash-1.5"

        messages=[
            {"role": "system", "content": "You are a precise research assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        extra_headers={
            "HTTP-Referer": "http://localhost",
            "X-Title": "Agentic Research Assistant"
        }
    )

    return response.choices[0].message.content.strip()
