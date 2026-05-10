from fastapi import APIRouter
from app.schemas.user_schema import UserInput
from app.services.model_service import analyze_user

router = APIRouter()

@router.post("/analyze")
def analyze(user: UserInput):
    result = analyze_user(user.dict())
    return result