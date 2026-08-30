from typing import List, Union

from pydantic import BaseModel, Field


# ============================================================
# INPUT SCHEMA
# Exact 26 Model B features
# ============================================================

class UserInput(BaseModel):

    # --------------------------------------------------------
    # Skills
    # --------------------------------------------------------

    analytical_thinking: int = Field(..., ge=1, le=5)
    resilience_flexibility_agility: int = Field(..., ge=1, le=5)
    leadership_social_influence: int = Field(..., ge=1, le=5)
    creative_thinking: int = Field(..., ge=1, le=5)
    motivation_self_awareness: int = Field(..., ge=1, le=5)
    technological_literacy: int = Field(..., ge=1, le=5)
    empathy_active_listening: int = Field(..., ge=1, le=5)
    curiosity_lifelong_learning: int = Field(..., ge=1, le=5)
    talent_management: int = Field(..., ge=1, le=5)
    service_orientation: int = Field(..., ge=1, le=5)

    # --------------------------------------------------------
    # Demographic
    # --------------------------------------------------------

    age: int = Field(..., ge=15, le=29)

    gender: str

    marital_status: str

    household_size: int = Field(..., ge=1)

    # --------------------------------------------------------
    # Education
    # --------------------------------------------------------

    education_level: str

    field_of_study: str

    time_since_studies: str

    # --------------------------------------------------------
    # Structural / capability
    # --------------------------------------------------------

    province: str

    digital_access: str

    english_communication: int = Field(..., ge=1, le=5)

    digital_confidence: int = Field(..., ge=1, le=5)

    # --------------------------------------------------------
    # Training
    # --------------------------------------------------------

    formal_training: str

    training_type: str

    training_field: str

    training_duration: str

    training_relevance: str


# ============================================================
# SHAP FACTOR
# Language-neutral response
# ============================================================

class ExplanationFactor(BaseModel):

    # Example:
    # "province"
    # "digital_access"
    # "technological_literacy"
    feature_key: str

    # Canonical value used by the model.
    # Frontend translates categorical values if necessary.
    value: Union[str, int, float]


# ============================================================
# OUTPUT SCHEMA
# ============================================================

class AnalyzeResponse(BaseModel):

    # Language-neutral key.
    #
    # Expected:
    # positive_employment_outcome
    # negative_employment_outcome
    status: str

    predicted_class: int = Field(
        ...,
        ge=0,
        le=1
    )

    positive_factors: List[ExplanationFactor] = []

    negative_factors: List[ExplanationFactor] = []