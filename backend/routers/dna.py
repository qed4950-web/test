from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend import models, schemas
from backend.database import get_db
from backend.services.dna_generator import generate_dna_signature, get_radar_animation_data

router = APIRouter(
    prefix="/v1/dna",
    tags=["dna"],
)

@router.post("/generate", response_model=schemas.DNASignature)
def create_dna_signature(
    request: schemas.DNASignatureCreate,
    org_id: str = "demo_org",
    db: Session = Depends(get_db)
):
    """
    Generate a unique DNA signature for a brand reference.
    Creates visual identity (pattern, color, icon seed) from flavor vector.
    """
    try:
        signature = generate_dna_signature(request.reference_id, org_id, db)
        return signature
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{reference_id}", response_model=schemas.DNASignature)
def get_dna_signature(
    reference_id: str,
    db: Session = Depends(get_db)
):
    """Get existing DNA signature for a reference"""
    sig = db.query(models.DNASignature).filter(
        models.DNASignature.brand_id == reference_id
    ).first()
    if not sig:
        raise HTTPException(status_code=404, detail="DNA Signature not found")
    return sig

@router.get("/radar/{transform_id}", response_model=schemas.RadarAnimationResponse)
def get_radar_animation(
    transform_id: str,
    db: Session = Depends(get_db)
):
    """
    Get radar animation data for a transform.
    Returns before/after vectors with interpolation keyframes.
    """
    try:
        data = get_radar_animation_data(transform_id, db)
        return data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
