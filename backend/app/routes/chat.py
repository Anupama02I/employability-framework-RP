from fastapi import APIRouter

from app.schemas.chat_schema import (
    ChatRequest,
    ChatResponse,
)

from app.services.chat_service import (
    generate_chatbot_reply,
)


router = APIRouter()


@router.post(
    "/chat",
    response_model=ChatResponse
)
def chat(
    request: ChatRequest
):

    reply = generate_chatbot_reply(

        message=
            request.message,

        profile=
            request.employabilityProfile,

        conversation_history=
            request.conversationHistory,

        uploaded_document=
            request.uploadedDocument,
    )


    return {
        "reply":
            reply
    }