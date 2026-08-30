import os

from fastapi import FastAPI

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from app.routes import (
    analyze,
    chat,
)

from app.routes.document_route import (
    router as document_router,
)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI()


# ============================================================
# ROUTES
# ============================================================

app.include_router(
    document_router
)

app.include_router(
    analyze.router
)

app.include_router(
    chat.router
)


# ============================================================
# CORS
#
# Local frontend URLs are kept for development.
# FRONTEND_URL will be added in Render after the
# frontend has been deployed.
# ============================================================

FRONTEND_URL = os.getenv(
    "FRONTEND_URL"
)


allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


if FRONTEND_URL:

    allowed_origins.append(
        FRONTEND_URL.rstrip("/")
    )


app.add_middleware(
    CORSMiddleware,

    allow_origins=
        allowed_origins,

    allow_credentials=
        True,

    allow_methods=[
        "*"
    ],

    allow_headers=[
        "*"
    ],
)


# ============================================================
# HEALTH CHECK
#
# Used to check whether the Render backend is running.
# ============================================================

@app.get(
    "/health"
)
def health_check():

    return {
        "status": "ok"
    }