from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/v1/references",
    tags=["references"],
)

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
