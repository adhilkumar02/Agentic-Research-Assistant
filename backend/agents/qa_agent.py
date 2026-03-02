def answer_question(question, retrieved_sections, llm_callable):
    """
    retrieved_sections: List of (score, text, metadata)
    """

    if not retrieved_sections:
        return "No relevant content found in selected documents."

    context_blocks = []

    for score, text, metadata in retrieved_sections:
        title = metadata.get("title", "Unknown section")

        context_blocks.append(
            f"[{title} | score={score:.4f}]\n{text}"
        )

    context = "\n\n".join(context_blocks)

    prompt = f"""
You are a research assistant.

Use ONLY the context below to answer the question.

Context:
{context}

Question:
{question}

Answer clearly and concisely.
"""

    return llm_callable(prompt)
