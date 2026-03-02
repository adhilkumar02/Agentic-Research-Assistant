from agents.summarization_prompts import PROMPTS

def summarize_section(
    section_text: str,
    document_type: str,
    llm_callable
) -> str:
    """
    Generate a section summary using a document-type-specific prompt.
    """

    prompt = PROMPTS.get(
        document_type,
        "Summarize the following section clearly:\n"
    )

    full_prompt = prompt + section_text

    return llm_callable(full_prompt)
