from fastapi import FastAPI
from app.routes import analyze, chat
from app.routes.document_route import (
    router as document_router,
)
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.include_router(
    document_router
)
app.include_router(analyze.router)
app.include_router(chat.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)