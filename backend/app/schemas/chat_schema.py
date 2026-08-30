from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.schemas.document_schema import (
    UploadedDocumentContext,
)

# ============================================================
# SHAP EXPLANATION FACTOR
#
# Example:
#
# {
#     "feature_key": "technological_literacy",
#     "value": 2
# }
#
# or:
#
# {
#     "feature_key": "province",
#     "value": "Western"
# }
# ============================================================

class ExplanationFactor(BaseModel):

    feature_key: str

    value: Any


# ============================================================
# ASSESSMENT CHAT HISTORY
#
# This is the structured conversation used while completing
# the employability assessment.
#
# The career-guidance chatbot does not need to depend on its
# exact internal structure, so it is kept flexible.
# ============================================================

class AssessmentChatItem(BaseModel):

    model_config = {
        "extra": "allow"
    }


# ============================================================
# EMPLOYABILITY PROFILE
#
# This matches the profile currently created by InputPage.jsx:
#
# {
#     selectedLanguage,
#     predictionResult,
#     predictedClass,
#     shapPositiveFactors,
#     shapNegativeFactors,
#     userAssessmentAnswers,
#     assessmentChatHistory
# }
#
# IMPORTANT:
#
# No:
# - raw probability
# - probability score
# - DiCE recommendations
# - counterfactual recommendations
# ============================================================

class EmployabilityProfile(BaseModel):

    # --------------------------------------------------------
    # Selected interface/chat language
    #
    # en = English
    # si = Sinhala
    # ta = Tamil
    # --------------------------------------------------------

    selectedLanguage: str = "en"


    # --------------------------------------------------------
    # Language-neutral result key
    #
    # Expected:
    #
    # positive_employment_outcome
    # negative_employment_outcome
    # --------------------------------------------------------

    predictionResult: Optional[str] = None


    # --------------------------------------------------------
    # Model class
    #
    # 0 = active unemployed recent-search outcome
    # 1 = employed outcome
    # --------------------------------------------------------

    predictedClass: Optional[int] = None


    # --------------------------------------------------------
    # Full SHAP explanation returned by /analyze
    #
    # These remain available to the chatbot for explanation.
    #
    # They must NOT automatically be treated as:
    # - strengths
    # - weaknesses
    # - recommendations
    # --------------------------------------------------------

    shapPositiveFactors: List[
        ExplanationFactor
    ] = Field(
        default_factory=list
    )


    shapNegativeFactors: List[
        ExplanationFactor
    ] = Field(
        default_factory=list
    )


    # --------------------------------------------------------
    # Exact assessment answers used by the prediction model
    #
    # Contains the 26 Model B input features.
    # --------------------------------------------------------

    userAssessmentAnswers: Optional[
        Dict[str, Any]
    ] = None


    # --------------------------------------------------------
    # Conversation created while completing the structured
    # assessment.
    #
    # Kept mainly as profile context.
    # --------------------------------------------------------

    assessmentChatHistory: List[
        AssessmentChatItem
    ] = Field(
        default_factory=list
    )


# ============================================================
# CAREER GUIDANCE CHAT MESSAGE
#
# Used for conversationHistory sent from ChatbotPage.jsx.
#
# Example:
#
# {
#     "role": "user",
#     "content": "How can I improve my CV?"
# }
# ============================================================

class ChatMessage(BaseModel):

    role: str

    content: str


# ============================================================
# POST /chat REQUEST
# ============================================================

class ChatRequest(BaseModel):

    message: str

    employabilityProfile: EmployabilityProfile

    conversationHistory: List[
        ChatMessage
    ] = Field(
        default_factory=list
    )

    # Optional document uploaded by the user.
    #
    # This may be:
    # - CV_RESUME
    # - JOB_DESCRIPTION
    # - COURSE_TRAINING
    # - EMPLOYABILITY_DOCUMENT
    #
    # It is separate from the employability assessment.
    uploadedDocument: Optional[
        UploadedDocumentContext
    ] = None

# ============================================================
# POST /chat RESPONSE
# ============================================================

class ChatResponse(BaseModel):

    reply: str