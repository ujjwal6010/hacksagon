import json
import logging
import os
import re
from pathlib import Path
from typing import Any
from urllib import error as url_error
from urllib import request as url_request

from dotenv import load_dotenv

from prompts import (
    build_clinical_extraction_prompt,
    build_rag_prompt,
    build_translation_prompt,
)

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
SARVAM_TRANSLATE_URL = os.getenv(
    "SARVAM_TRANSLATE_URL", "https://api.sarvam.ai/translate"
)
VECTOR_DB_PATH = Path(__file__).resolve().parent / "vectordb"
COLLECTION_NAME = "maternal_health"


def normalize_language_code(lang: str | None) -> str:
    if not lang:
        return "en"

    normalized = lang.strip().replace("_", "-")
    if not normalized:
        return "en"

    parts = normalized.split("-")
    if len(parts) == 1:
        return parts[0].lower()

    return f"{parts[0].lower()}-{parts[1].upper()}"


def _safe_json_loads(text: str) -> dict[str, Any] | None:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None


def _post_json(url: str, payload: dict[str, Any], headers: dict[str, str], timeout: int = 20) -> dict[str, Any]:
    req = url_request.Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with url_request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8")
        parsed = _safe_json_loads(body)
        if not parsed:
            raise ValueError("Invalid JSON response")
        return parsed


def _groq_chat(prompt: str, max_tokens: int = 220, temperature: float = 0.2) -> str:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not configured")

    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    data = _post_json("https://api.groq.com/openai/v1/chat/completions", payload, headers)
    return data["choices"][0]["message"]["content"].strip()


def _sarvam_translate(text: str, source_lang: str, target_lang: str) -> str:
    if not SARVAM_API_KEY:
        raise RuntimeError("SARVAM_API_KEY not configured")

    payload = {"text": text, "source_language": source_lang, "target_language": target_lang}
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json",
    }
    data = _post_json(SARVAM_TRANSLATE_URL, payload, headers)
    translated = data.get("translated_text") or data.get("translation")
    if not translated:
        raise ValueError("Sarvam translation response missing translated text")
    return translated.strip()


def translate_to_english(text: str, source_lang: str) -> str:
    source = normalize_language_code(source_lang)
    if source.startswith("en"):
        return text

    try:
        return _sarvam_translate(text, source, "en")
    except Exception as sarvam_err:
        logger.warning("Sarvam translate_to_english failed: %s", sarvam_err)

    try:
        prompt = build_translation_prompt(text, source, "en")
        return _groq_chat(prompt, max_tokens=260, temperature=0.0)
    except Exception as groq_err:
        logger.warning("Groq translate_to_english failed: %s", groq_err)

    return text


def translate_from_english(text: str, target_lang: str) -> str:
    target = normalize_language_code(target_lang)
    if target.startswith("en"):
        return text

    try:
        return _sarvam_translate(text, "en", target)
    except Exception as sarvam_err:
        logger.warning("Sarvam translate_from_english failed: %s", sarvam_err)

    try:
        prompt = build_translation_prompt(text, "en", target)
        return _groq_chat(prompt, max_tokens=280, temperature=0.0)
    except Exception as groq_err:
        logger.warning("Groq translate_from_english failed: %s", groq_err)

    return text


def _get_collection():
    try:
        import chromadb

        VECTOR_DB_PATH.mkdir(parents=True, exist_ok=True)
        client = chromadb.PersistentClient(path=str(VECTOR_DB_PATH))
        return client.get_collection(COLLECTION_NAME)
    except Exception as err:
        logger.warning("Vector DB unavailable: %s", err)
        return None


def retrieve_context(english_query: str, top_k: int = 5) -> tuple[list[str], bool]:
    collection = _get_collection()
    if collection is None:
        return [], False

    try:
        result = collection.query(query_texts=[english_query], n_results=top_k)
        docs = result.get("documents", [[]])[0] if result else []
        return [d for d in docs if isinstance(d, str) and d.strip()], bool(docs)
    except Exception as err:
        logger.warning("Retrieval failed: %s", err)
        return [], False


def _fallback_answer(english_query: str) -> str:
    q = english_query.lower()

    emergency_terms = [
        "heavy bleeding",
        "severe pain",
        "high fever",
        "no fetal movement",
        "reduced fetal movement",
        "convulsion",
        "fainting",
    ]
    if any(term in q for term in emergency_terms):
        return (
            "Your symptoms may be urgent. Please go to the nearest emergency facility now "
            "or contact your obstetric doctor immediately."
        )

    if "headache" in q:
        return (
            "Please rest, drink water, and monitor your blood pressure if possible. "
            "If headache is severe, persistent, or with blurred vision, seek urgent care."
        )

    if "fever" in q:
        return (
            "Take fluids and monitor temperature. "
            "If fever is high or persistent, or you feel weak, contact a doctor today."
        )

    if "movement" in q or "baby moving" in q:
        return (
            "Monitor fetal movement now. "
            "If movement remains reduced compared with usual pattern, seek urgent obstetric review."
        )

    return (
        "Please monitor symptoms, stay hydrated, and rest. "
        "If symptoms worsen or do not improve, contact your doctor for in-person evaluation."
    )


def generate_answer(
    english_query: str,
    docs: list[str],
    patient_data: object,
    history: list[dict[str, Any]],
) -> str:
    prompt = build_rag_prompt(english_query, docs, patient_data, history)
    try:
        answer = _groq_chat(prompt, max_tokens=220, temperature=0.2)
        answer = re.sub(r"\s+", " ", answer).strip()
        return answer if answer else _fallback_answer(english_query)
    except Exception as err:
        logger.warning("Answer generation fallback used: %s", err)
        return _fallback_answer(english_query)


def _default_clinical() -> dict[str, Any]:
    return {
        "symptoms": [],
        "medications": [],
        "relief_noted": False,
        "relief_details": "",
        "fetal_movement": "unknown",
        "severity": 0,
        "summary": "",
    }


def _heuristic_clinical(english_query: str, english_answer: str) -> dict[str, Any]:
    clinical = _default_clinical()
    text = f"{english_query} {english_answer}".lower()

    symptom_keywords = [
        "headache",
        "fever",
        "bleeding",
        "vomiting",
        "nausea",
        "abdominal pain",
        "dizziness",
        "swelling",
    ]
    for key in symptom_keywords:
        if key in text:
            clinical["symptoms"].append(
                {"name": key, "status": "active", "reported_time": "current"}
            )

    med_match = re.findall(r"(?:take|took|taking)\s+([a-zA-Z0-9\s-]{2,30})", text)
    for med in med_match[:3]:
        clinical["medications"].append(
            {
                "name": med.strip(),
                "taken": True,
                "taken_time": "",
                "effect_noted": "",
            }
        )

    if "relief" in text or "better" in text or "improved" in text:
        clinical["relief_noted"] = True
        clinical["relief_details"] = "Patient reported some symptom relief."

    if "no fetal movement" in text or "reduced fetal movement" in text:
        clinical["fetal_movement"] = "no"
    elif "fetal movement" in text or "baby moving" in text:
        clinical["fetal_movement"] = "yes"

    score_match = re.search(r"(\d{1,2})\s*/\s*10", text)
    if score_match:
        severity = int(score_match.group(1))
    elif "severe" in text:
        severity = 8
    elif "moderate" in text:
        severity = 5
    elif "mild" in text:
        severity = 3
    else:
        severity = 4 if clinical["symptoms"] else 0

    clinical["severity"] = max(0, min(10, severity))
    clinical["summary"] = (
        english_answer[:180].strip() if english_answer else "Symptoms discussed with concise guidance."
    )

    return clinical


def extract_clinical_data(english_query: str, english_answer: str) -> dict[str, Any]:
    try:
        prompt = build_clinical_extraction_prompt(english_query, english_answer)
        raw = _groq_chat(prompt, max_tokens=320, temperature=0.0)
        parsed = _safe_json_loads(raw)
        if not parsed:
            raise ValueError("LLM did not return valid JSON")

        clinical = _default_clinical()
        clinical.update(parsed)

        if not isinstance(clinical.get("symptoms"), list):
            clinical["symptoms"] = []
        if not isinstance(clinical.get("medications"), list):
            clinical["medications"] = []

        severity = clinical.get("severity", 0)
        try:
            severity_int = int(severity)
        except Exception:
            severity_int = 0
        clinical["severity"] = max(0, min(10, severity_int))

        fetal = str(clinical.get("fetal_movement", "unknown")).lower()
        clinical["fetal_movement"] = fetal if fetal in {"yes", "no", "unknown"} else "unknown"

        return clinical
    except Exception as err:
        logger.warning("Clinical extraction fallback used: %s", err)
        return _heuristic_clinical(english_query, english_answer)


class JananiRAGService:
    def ask(
        self,
        query: str,
        language_code: str,
        patient_data: Any,
        history: list[dict[str, Any]],
        source: str,
    ) -> dict[str, Any]:
        del source  # Reserved for future channel-specific behavior.

        verified_language = normalize_language_code(language_code)
        english_query = translate_to_english(query, verified_language)

        docs, retrieval_used = retrieve_context(english_query, top_k=5)
        english_answer = generate_answer(english_query, docs, patient_data, history)
        localized_answer = translate_from_english(english_answer, verified_language)
        clinical = extract_clinical_data(english_query, english_answer)

        return {
            "status": "success",
            "english_query": english_query,
            "english_answer": english_answer,
            "localized_answer": localized_answer,
            "verified_language": verified_language,
            "retrieval_meta": {
                "used": retrieval_used,
                "documents_count": len(docs),
            },
            "clinical": clinical,
        }


def safe_ask_fallback(query: str, language_code: str) -> dict[str, Any]:
    verified_language = normalize_language_code(language_code)
    english_query = query.strip()
    english_answer = _fallback_answer(english_query)

    return {
        "status": "success",
        "english_query": english_query,
        "english_answer": english_answer,
        "localized_answer": english_answer,
        "verified_language": verified_language,
        "retrieval_meta": {"used": False, "documents_count": 0},
        "clinical": _default_clinical(),
    }
