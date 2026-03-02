def merge_small_sections(sections, min_chars=300):
    """
    Merge sections that are too small into the previous section.
    """
    if not sections:
        return []

    merged = [sections[0]]

    for sec in sections[1:]:
        if len(sec["content"]) < min_chars:
            # merge into previous
            merged[-1]["content"] += "\n\n" + sec["content"]
            merged[-1]["end_char"] = sec["end_char"]
        else:
            merged.append(sec)

    return merged
