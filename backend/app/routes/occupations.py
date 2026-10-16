from fastapi import (
    APIRouter,
    HTTPException,
    Query,
)

from app.services.occupation_service import (
    get_occupation_by_code,
    search_occupations,
)


router = APIRouter(
    prefix="/occupations",
    tags=[
        "Occupation Explorer"
    ]
)


# ============================================================
# SEARCH / FEATURED OCCUPATIONS
# ============================================================

@router.get(
    ""
)
def occupations(
    search: str = Query(
        default="",
        max_length=100,
    ),
    limit: int = Query(
        default=8,
        ge=1,
        le=20,
    ),
):

    try:

        results = (
            search_occupations(
                search=search,
                limit=limit,
            )
        )


        return {

            "source":
                "European Commission - ESCO",

            "source_version":
                "1.2.1",

            "search":
                search,

            "count":
                len(
                    results
                ),

            "occupations":
                results,
        }


    except Exception as error:

        print(
            "Occupation search error:",
            repr(
                error
            )
        )


        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to load "
                "occupation information."
            )
        )


# ============================================================
# OCCUPATION DETAILS
# ============================================================

@router.get(
    "/{esco_code}"
)
def occupation_details(
    esco_code: str
):

    try:

        occupation = (
            get_occupation_by_code(
                esco_code
            )
        )


        if not occupation:

            raise HTTPException(
                status_code=404,
                detail=(
                    "Occupation was not found."
                )
            )


        return occupation


    except HTTPException:

        raise


    except Exception as error:

        print(
            "Occupation details error:",
            repr(
                error
            )
        )


        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to load "
                "occupation details."
            )
        )