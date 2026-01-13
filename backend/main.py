from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routers import references, recipes, transforms

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FlavorOS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(references.router)
app.include_router(recipes.router)
app.include_router(transforms.router)
from .routers import logs, stores, alerts, ai
app.include_router(logs.router)
app.include_router(stores.router)
app.include_router(alerts.router)
app.include_router(ai.router)

@app.get("/")
def read_root():
    return {"message": "FlavorOS API is running"}
