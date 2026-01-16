from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from backend import models, schemas
from backend.database import get_db, SessionLocal
from backend.services.reference_pipeline import process_file_upload, run_metric_estimation

router = APIRouter(
    prefix="/v1/references",
    tags=["references"],
)

@router.get("/stats")
def get_reference_stats(org_id: str = "demo_org", db: Session = Depends(get_db)):
    """Get reference counts by category"""
    from sqlalchemy import func
    stats = db.query(
        models.Reference.menu_category, 
        func.count(models.Reference.id)
    ).filter(
        models.Reference.org_id == org_id
    ).group_by(
        models.Reference.menu_category
    ).all()
    
    return {category: count for category, count in stats}

@router.post("/upload", response_model=List[schemas.Reference])
def upload_references(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    org_id: str = "default_org", # TODO: Get from auth
    db: Session = Depends(get_db)
):
    # Process file and create references (QUEUED)
    new_refs = process_file_upload(file, org_id, db)
    
    # Trigger background metric estimation
    ref_ids = [r.id for r in new_refs]
    # We need a new session for background task, or pass session factory
    # Actually background tasks in FastAPI run after response.
    # We should pass IDs and let the worker create its own session.
    # But for strict correctness, we pass IDs.
    
    background_tasks.add_task(run_metric_estimation, ref_ids, SessionLocal)
    
    return new_refs

@router.post("/demo/seed")
def seed_sample_data(db: Session = Depends(get_db)):
    """Create basic sample data for demonstration"""
    # 1. Anchor Reference
    anchor = models.Reference(
        id="anchor_demo",
        org_id="demo_org",
        name="Standard Burger",
        menu_category="Burger",
        reference_type=schemas.ReferenceType.ANCHOR,
        source_kind=schemas.SourceKind.INTERNAL,
        process_status=schemas.ReferenceProcessStatus.COMPLETED
    )
    # Anchor Fingerprint (Standard Flavor)
    anchor_fp = models.ReferenceFingerprint(
        id="fp_anchor_demo",
        reference_id="anchor_demo",
        vector=[0.5, 0.5, 0.5, 0.4, 0.6], # Balanced
        metrics_json={"taste_score": 80, "sweetness": 50, "saltiness": 50}
    )
    
    # 2. Competitor Reference
    competitor = models.Reference(
        id="comp_demo",
        org_id="demo_org",
        name="Spicy Mega Burger",
        menu_category="Burger",
        reference_type=schemas.ReferenceType.BRAND,
        source_kind=schemas.SourceKind.MARKET,
        process_status=schemas.ReferenceProcessStatus.COMPLETED
    )
    comp_fp = models.ReferenceFingerprint(
        id="fp_comp_demo",
        reference_id="comp_demo",
        vector=[0.8, 0.2, 0.9, 0.4, 0.6], # Spicy, Low Sweet, Salty
        metrics_json={"taste_score": 90, "sweetness": 20, "saltiness": 90}
    )
    
    # 3. Stores
    store1 = models.Store(id="s_demo_1", org_id="demo_org", name="Gangnam Station", status="ACTIVE", deviation=5.2)
    store2 = models.Store(id="s_demo_2", org_id="demo_org", name="Hongdae", status="ACTIVE", deviation=12.5)
    
    # Add if not exists
    if not db.query(models.Reference).filter_by(id="anchor_demo").first():
        db.add(anchor)
        db.add(anchor_fp)
    
    if not db.query(models.Reference).filter_by(id="comp_demo").first():
        db.add(competitor)
        db.add(comp_fp)
        
    if not db.query(models.Store).filter_by(id="s_demo_1").first():
        db.add(store1)
        db.add(store2)
        
    db.commit()
    return {"message": "Sample data seeded successfully", "org_id": "demo_org"}

@router.post("/{reference_id}/vectorize")
def vectorize_reference(reference_id: str, db: Session = Depends(get_db)):
    """Generate vector based on keywords in metadata"""
    ref = db.query(models.Reference).filter(models.Reference.id == reference_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Reference not found")
        
    # Extract keywords
    metadata = ref.metadata_json or {}
    keywords = metadata.get("keywords", [])
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(",")]
        
    if not keywords:
        # If no keywords, fail or return empty logic
        # For demo, let's allow trying to parse 'menu_category' as a fallback keyword
        if ref.menu_category:
            keywords.append(ref.menu_category)
    
    # Generate Vector
    from ..services.rule_vectorizer import rule_vectorizer
    vector = rule_vectorizer.vectorize_from_keywords(keywords)
    
    # Save to Fingerprint
    # Check existing fingerprint
    fingerprint = db.query(models.ReferenceFingerprint).filter(
        models.ReferenceFingerprint.reference_id == reference_id
    ).first()
    
    if fingerprint:
        fingerprint.vector = vector
        fingerprint.metrics_json = {"vector_source": "rule_based", "keywords": keywords}
    else:
        # Create new
        fingerprint = models.ReferenceFingerprint(
            id=f"fp_{reference_id}",
            reference_id=reference_id,
            vector=vector,
            metrics_json={"vector_source": "rule_based", "keywords": keywords}
        )
        db.add(fingerprint)
        
    ref.process_status = schemas.ReferenceProcessStatus.COMPLETED
    db.commit()
    
    return {"message": f"Vectorization triggered for reference {reference_id}", "fingerprint_id": fingerprint.id}

@router.post("/{reference_id}/reverse-engineer", response_model=schemas.ReverseAnalysis)
def reverse_engineer_reference(
    reference_id: str,
    db: Session = Depends(get_db)
):
    """
    Analyze a reference's flavor structure.
    Returns structure summary, primary factors, and cooking params.
    """
    from backend.services.reverse_engineer import reverse_engineer_reference as do_reverse
    try:
        analysis = do_reverse(reference_id, db)
        return analysis
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/demo/experience")
def get_demo_experience(db: Session = Depends(get_db)):
    """
    Get a curated demo experience with sample data.
    Returns brand, competitor, and suggested actions.
    """
    # Check if demo data exists
    brand = db.query(models.Reference).filter(
        models.Reference.reference_type == "BRAND"
    ).first()
    
    competitor = db.query(models.Reference).filter(
        models.Reference.reference_type == "ANCHOR"
    ).first()
    
    transform = db.query(models.Transform).first()
    
    if not brand:
        return {
            "has_data": False,
            "message": "No demo data found. Call POST /v1/references/demo/seed first.",
            "suggested_actions": [
                {"action": "seed_data", "endpoint": "POST /v1/references/demo/seed", "label": "데모 데이터 생성"}
            ]
        }
    
    actions = [
        {"action": "view_dna", "endpoint": f"POST /v1/dna/generate", "label": "DNA 서명 보기", "params": {"reference_id": brand.id}},
        {"action": "reverse_engineer", "endpoint": f"POST /v1/references/{brand.id}/reverse-engineer", "label": "맛 구조 분석"},
    ]
    
    if transform:
        actions.append({
            "action": "radar_show", 
            "endpoint": f"GET /v1/dna/radar/{transform.id}", 
            "label": "레이더 쇼 보기"
        })
    
    return {
        "has_data": True,
        "sample_brand": {"id": brand.id, "name": brand.name, "category": brand.menu_category} if brand else None,
        "sample_competitor": {"id": competitor.id, "name": competitor.name, "category": competitor.menu_category} if competitor else None,
        "sample_transform_id": transform.id if transform else None,
        "suggested_actions": actions
    }
@router.post("/", response_model=schemas.Reference)
def create_reference(ref: schemas.ReferenceCreate, db: Session = Depends(get_db)):
    db_ref = models.Reference(**ref.dict())
    db.add(db_ref)
    db.commit()
    db.refresh(db_ref)
    return db_ref

@router.get("/", response_model=List[schemas.Reference])
def read_references(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    refs = db.query(models.Reference).offset(skip).limit(limit).all()
    return refs

@router.get("/{reference_id}", response_model=schemas.Reference)
def read_reference(reference_id: str, db: Session = Depends(get_db)):
    ref = db.query(models.Reference).filter(models.Reference.id == reference_id).first()
    if ref is None:
        raise HTTPException(status_code=404, detail="Reference not found")
    return ref

@router.post("/{reference_id}/fingerprints", response_model=schemas.ReferenceFingerprint)
def create_fingerprint(reference_id: str, fp: schemas.ReferenceFingerprintCreate, db: Session = Depends(get_db)):
    db_fp = models.ReferenceFingerprint(**fp.dict(), reference_id=reference_id)
    db.add(db_fp)
    db.commit()
    db.refresh(db_fp)
    return db_fp
