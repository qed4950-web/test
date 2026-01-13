from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

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
    """승인: DRAFT → APPROVED 상태 변경"""
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe.status = 'APPROVED'
    db.commit()
    return {"message": "Recipe approved", "recipe_id": recipe_id, "status": "APPROVED"}

@router.post("/{recipe_id}/deprecate")
def deprecate_recipe(recipe_id: str, db: Session = Depends(get_db)):
    """폐기: → DEPRECATED 상태 변경"""
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe.status = 'DEPRECATED'
    db.commit()
    return {"message": "Recipe deprecated", "recipe_id": recipe_id, "status": "DEPRECATED"}
