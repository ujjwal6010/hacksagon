SYSTEM_ANSWER_RULES = (
    "You are Janani maternal health assistant. "
    "Give safe, concise, voice-friendly guidance for pregnancy-related questions. "
    "Use short plain sentences. No markdown. No long paragraphs. "
    "If emergency signs appear (heavy bleeding, severe pain, high fever, reduced fetal movement), "
    "advise urgent medical care immediately."
)


def build_rag_prompt(
    english_query: str,
    retrieved_docs: list[str],
    patient_data: object,
    history: list[dict],
) -> str:
    context = "\n\n".join(retrieved_docs) if retrieved_docs else "No retrieval context available."

    history_lines = []
    for item in history[-5:]:
        user_text = item.get("user", "") if isinstance(item, dict) else ""
        ai_text = item.get("assistant", "") if isinstance(item, dict) else ""
        history_lines.append(f"User: {user_text}\nAssistant: {ai_text}")
    short_history = "\n".join(history_lines) if history_lines else "No prior history."

    return (
        f"{SYSTEM_ANSWER_RULES}\n\n"
        f"Patient data:\n{patient_data}\n\n"
        f"Recent conversation:\n{short_history}\n\n"
        f"Knowledge context:\n{context}\n\n"
        f"User query:\n{english_query}\n\n"
        "Respond with only the final answer text. Keep it brief and actionable."
    )


def build_translation_prompt(text: str, source_lang: str, target_lang: str) -> str:
    return (
        "Translate the text accurately with medical meaning preserved. "
        "Do not add advice. Return only translated text.\n\n"
        f"Source language: {source_lang}\n"
        f"Target language: {target_lang}\n"
        f"Text: {text}"
    )


def build_clinical_extraction_prompt(english_query: str, english_answer: str) -> str:
    return (
        "Extract clinical details from the conversation and return valid JSON only. "
        "Schema keys: symptoms(array of {name,status,reported_time}), "
        "medications(array of {name,taken,taken_time,effect_noted}), "
        "relief_noted(boolean), relief_details(string), fetal_movement(string: yes|no|unknown), "
        "severity(integer 0-10), summary(string)."
        "\n\n"
        f"User query: {english_query}\n"
        f"Assistant answer: {english_answer}"
    )
