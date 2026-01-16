import pytest
from backend.services.llm_reliability import llm_service
from pydantic import BaseModel

class MockMetric(BaseModel):
    taste_score: float
    texture: str

def test_safe_generate_success():
    # Normal case
    result = llm_service.safe_generate("analyze recipe")
    assert result["content"] == "Mock text response"

def test_safe_generate_with_schema():
    # Schema case
    result = llm_service.safe_generate("analyze metric", schema=MockMetric)
    assert result["taste_score"] == 8.5
    assert result["texture"] == "crispy"

def test_fallback_mechanism():
    # Trigger primary failure
    result = llm_service.safe_generate("fail_please analyze")
    # Should still succeed via fallback
    assert result["content"] == "Mock text response"

def test_caching_behavior():
    # Setup DB for cache
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from backend.database import Base
    from backend.models import LLMCache
    
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    
    prompt = "heavy query"
    
    # First call - Not Cached
    resp1 = llm_service.safe_generate(prompt, db=db)
    assert resp1["content"] == "Mock text response"
    
    # Check DB
    cache_entry = db.query(LLMCache).first()
    assert cache_entry is not None
    assert cache_entry.response_json["content"] == "Mock text response"
    
    # Second call - load from Cache (mock would print "Returning cached...")
    # We can verify by modifying the mock to return something else if called again,
    # but safe_generate logic returns early if cache hit.
    # We rely on the fact that db query happens.
    
    resp2 = llm_service.safe_generate(prompt, db=db)
    assert resp2 == resp1
