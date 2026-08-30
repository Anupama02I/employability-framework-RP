from fastapi import APIRouter, HTTPException

from app.schemas.user_schema import (
    UserInput,
    AnalyzeResponse,
)

from app.services.model_service import (
    analyze_user,
)


router = APIRouter(
    prefix="",
    tags=["Employability Analysis"]
)


@router.post(
    "/analyze",
    response_model=AnalyzeResponse
)
def analyze(user: UserInput):

    try:
        # Pydantic v2
        input_data = user.model_dump()

        result = analyze_user(
            input_data
        )

        return result

    except ValueError as e:

        # Used for invalid canonical categories,
        # missing model inputs, etc.
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        # Do not expose internal model / server
        # implementation details to frontend.
        print(
            "Analyze endpoint error:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate the "
                "employability prediction."
            )
        )