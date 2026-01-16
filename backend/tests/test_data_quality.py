from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pandas as pd
import io
from fastapi import UploadFile

from backend.database import Base
from backend.models import Reference
from backend.services.reference_pipeline import process_file_upload
from backend.routers.references import get_reference_stats

# Setup In-Memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def test_process_file_upload_logic():
    db = TestingSessionLocal()
    
    # 1. Clean Data Upload
    csv_content = b"""name,menu_category,price,keywords
Burger A,Burger,10000,"spicy"
Burger B,Burger,12000,"sweet"
Pizza A,Pizza,20000,"cheesy"
"""
    file = UploadFile(filename="test1.csv", file=io.BytesIO(csv_content))
    
    # Run logic directly
    created = process_file_upload(file, "test_org", db)
    assert len(created) == 3
    
    # 2. Duplicate + Invalid Upload
    # Burger A (Duplicate - Skip)
    # Invalid (No Category - Skip)
    # Sandwich A (New - Add)
    csv_content_2 = b"""name,menu_category,price
Burger A,Burger,10000
Invalid Item,,500
Sandwich A,Sandwich,8000
"""
    file2 = UploadFile(filename="test2.csv", file=io.BytesIO(csv_content_2))
    
    created_2 = process_file_upload(file2, "test_org", db)
    
    assert len(created_2) == 1
    assert created_2[0].name == "Sandwich A"
    
    # Verify DB state
    all_refs = db.query(Reference).all()
    assert len(all_refs) == 4 # 3 initial + 1 new
    
    db.close()

def test_stats_logic():
    db = TestingSessionLocal()
    # Clear DB first (in-memory persists due to StaticPool if shared, but here we might want isolation)
    # With StaticPool, it persists across sessions.
    # Previous test added 4 items: Burger(2), Pizza(1), Sandwich(1)
    
    stats = get_reference_stats("test_org", db)
    
    print(f"DEBUG Stats: {stats}")
    
    assert stats['Burger'] == 2
    assert stats['Pizza'] == 1
    assert stats['Sandwich'] == 1
    
    db.close()
