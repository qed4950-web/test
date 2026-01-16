from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Dict, Any
from .. import models, schemas
from ..database import get_db
from ..services import version_control

router = APIRouter(
    prefix="/v1/recipes",
    tags=["recipes"],
)

@router.post("/", response_model=schemas.Recipe)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    db_recipe = models.Recipe(**recipe.dict())
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe

@router.get("/", response_model=List[schemas.Recipe])
def read_recipes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    recipes = db.query(models.Recipe).offset(skip).limit(limit).all()
    return recipes

@router.post("/{recipe_id}/versions", response_model=schemas.RecipeVersion)
def create_recipe_version(recipe_id: str, version: schemas.RecipeVersionCreate, db: Session = Depends(get_db)):
    db_version = models.RecipeVersion(**version.dict(), recipe_id=recipe_id)
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    return db_version

@router.get("/versions/{version_id}", response_model=schemas.RecipeVersion)
def read_recipe_version(version_id: str, db: Session = Depends(get_db)):
    version = db.query(models.RecipeVersion).filter(models.RecipeVersion.id == version_id).first()
    if version is None:
        raise HTTPException(status_code=404, detail="Version not found")
    return version

@router.post("/{recipe_id}/approve")
def approve_recipe(recipe_id: str, db: Session = Depends(get_db)):
    """승인: DRAFT → APPROVED 상태 변경 (최신 버전도 함께 승인)"""
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe.status = 'APPROVED'
    
    # Also approve the latest pending version if exists
    latest_version = db.query(models.RecipeVersion)\
        .filter(models.RecipeVersion.recipe_id == recipe_id)\
        .order_by(models.RecipeVersion.created_at.desc())\
        .first()
        
    if latest_version and latest_version.approval_status == 'PENDING':
        latest_version.approval_status = 'APPROVED'
        latest_version.approved_at = func.now()

    db.commit()
    return {"message": "Recipe and latest version approved", "recipe_id": recipe_id, "status": "APPROVED"}

@router.post("/{recipe_id}/deprecate")
def deprecate_recipe(recipe_id: str, db: Session = Depends(get_db)):
    """폐기: → DEPRECATED 상태 변경"""
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe.status = 'DEPRECATED'
    db.commit()
    recipe.status = 'DEPRECATED'
    db.commit()
    return {"message": "Recipe deprecated", "recipe_id": recipe_id, "status": "DEPRECATED"}

@router.get("/diff_versions", response_model=Dict[str, Any])
def diff_versions(v1_id: str, v2_id: str, db: Session = Depends(get_db)):
    return version_control.get_version_diff(v1_id, v2_id, db)

@router.post("/versions/{version_id}/approve")
def approve_recipe_version(
    version_id: str, 
    user_id: str = "admin_user_id", # Mock auth
    db: Session = Depends(get_db)
):
    version = version_control.approve_version(version_id, user_id, db)
    return {"message": "Version approved", "version_id": version.id, "status": "APPROVED"}

@router.post("/signature", response_model=schemas.InventedSignature)
def invent_signature(
    request: schemas.InventedSignatureCreate,
    org_id: str = "demo_org",
    db: Session = Depends(get_db)
):
    """
    Invent a new signature by combining base references.
    Returns new vector with generated name, story, and keywords.
    """
    from ..services.signature_inventor import invent_signature as do_invent
    try:
        sig = do_invent(request.base_reference_ids, request.direction, org_id, db)
        return schemas.InventedSignature(
            id=sig.id,
            org_id=sig.org_id,
            vector=sig.vector,
            generated_name=sig.generated_name,
            generated_story=sig.generated_story,
            concept_keywords=sig.concept_keywords,
            base_references=sig.base_references,
            direction=sig.direction,
            created_at=sig.created_at
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

