from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from api.upload import router as upload_router
from api.sections import router as sections_router
from api.summarize import router as summarize_router
from api.ask import router as ask_router
from api.ask_all import router as ask_all_router
from api.list_documents import router as list_router
app = FastAPI(title="Agentic Research Assistant")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(upload_router)
app.include_router(list_router)
app.include_router(sections_router)
app.include_router(summarize_router)
app.include_router(ask_router)
app.include_router(ask_all_router)

from fastapi.staticfiles import StaticFiles

os.makedirs("storage", exist_ok=True)
app.mount("/files", StaticFiles(directory="storage"), name="files")
