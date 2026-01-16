from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, timedelta

from backend.database import Base
from backend import models
from backend.services.llm_cache import llm_cache
from backend.services.batch_experiments import run_batch_experiment, get_experiment_run_status

# Setup In-Memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def test_cache_hit_tracking():
    db = TestingSessionLocal()
    
    # Cache a response
    prompt = "Test prompt for caching"
    model = "gemma-27b"
    response = {"result": "Test response"}
    
    llm_cache.cache_response(db, prompt, model, response)
    
    # First hit
    cached = llm_cache.get_cached_response(db, prompt, model)
    assert cached == response
    
    # Check hit count
    entry = db.query(models.LLMCache).first()
    assert entry.hit_count == 1
    assert entry.last_hit_at is not None
    
    # Second hit
    cached2 = llm_cache.get_cached_response(db, prompt, model)
    assert cached2 == response
    
    db.refresh(entry)
    assert entry.hit_count == 2
    
    # Get stats
    stats = llm_cache.get_cache_stats(db)
    assert stats["total_entries"] == 1
    assert stats["total_hits"] == 2
    
    db.close()

def test_batch_experiment():
    db = TestingSessionLocal()
    
    # Setup: Base and target references
    base_ref = models.Reference(
        id="ref_base",
        org_id="org1",
        name="Base Reference",
        reference_type="ANCHOR",
        menu_category="Chicken",
        source_kind="INTERNAL"
    )
    db.add(base_ref)
    
    base_fp = models.ReferenceFingerprint(
        id="fp_base",
        reference_id="ref_base",
        vector=[0.5, 0.5, 0.5, 0.5, 0.5]
    )
    db.add(base_fp)
    
    target_ref = models.Reference(
        id="ref_target",
        org_id="org1",
        name="Target Reference",
        reference_type="BRAND",
        menu_category="Chicken",
        source_kind="MARKET"
    )
    db.add(target_ref)
    
    target_fp = models.ReferenceFingerprint(
        id="fp_target",
        reference_id="ref_target",
        vector=[0.9, 0.3, 0.7, 0.2, 0.8]
    )
    db.add(target_fp)
    db.commit()
    
    # Run batch experiment
    run = run_batch_experiment(
        base_reference_id="ref_base",
        target_reference_ids=["ref_target"],
        modes=["COPY", "DISTANCE"],
        alphas=[0.3, 0.7],
        org_id="org1",
        db=db
    )
    
    # Verify
    assert run.id is not None
    assert run.status == "COMPLETED"
    assert run.total_combinations == 4  # 1 target * 2 modes * 2 alphas
    assert run.completed_count == 4
    assert run.duration_ms is not None
    assert len(run.results_json) == 4
    
    # Check results structure
    for result in run.results_json:
        assert "config" in result
        assert "result" in result or "error" in result
    
    # Get status
    status = get_experiment_run_status(run.id, db)
    assert status["progress_pct"] == 100.0
    
    db.close()
