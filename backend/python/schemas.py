from typing import Any

from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    query: str = Field(..., min_length=1)
    language_code: str = Field(default="hi-IN")
    patient_data: Any = None
    history: list[dict[str, Any]] = Field(default_factory=list)
    source: str = Field(default="website_text")


class RetrievalMeta(BaseModel):
    used: bool = False
    documents_count: int = 0


class SymptomItem(BaseModel):
    name: str
    status: str = "unknown"
    reported_time: str = ""


class MedicationItem(BaseModel):
    name: str
    taken: bool = False
    taken_time: str = ""
    effect_noted: str = ""


class ClinicalData(BaseModel):
    symptoms: list[SymptomItem] = Field(default_factory=list)
    medications: list[MedicationItem] = Field(default_factory=list)
    relief_noted: bool = False
    relief_details: str = ""
    fetal_movement: str = "unknown"
    severity: int = 0
    summary: str = ""


class AskResponse(BaseModel):
    status: str = "success"
    english_query: str
    english_answer: str
    localized_answer: str
    verified_language: str
    retrieval_meta: RetrievalMeta
    clinical: ClinicalData
