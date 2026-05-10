from fastapi import FastAPI
from app.routes import analyze
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.include_router(analyze.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)