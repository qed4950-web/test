from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routers import references, recipes, transforms, deployments, logs, stores, alerts, ai, dashboard, experiments, dna, strategies, analysis, benchmarks, trends, fun, explore, vibe, recommendations, accounting
from .services.local_llm import warmup

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FlavorOS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(references.router)
app.include_router(recipes.router)
app.include_router(transforms.router)
app.include_router(deployments.router)
app.include_router(experiments.router)
app.include_router(dashboard.router)
app.include_router(logs.router)
app.include_router(stores.router)
app.include_router(alerts.router)
app.include_router(ai.router)
app.include_router(dna.router)
app.include_router(strategies.router)
app.include_router(analysis.router)
app.include_router(benchmarks.router)
app.include_router(trends.router)
app.include_router(fun.router)
app.include_router(explore.router)
app.include_router(vibe.router)
app.include_router(recommendations.router)
app.include_router(accounting.router)

@app.on_event("startup")
def warmup_local_llm():
    warmup()

@app.get("/")
def read_root():
    return {"message": "FlavorOS API is running"}
