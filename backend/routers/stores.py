from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/v1/stores",
    tags=["stores"],
)

@router.get("/", response_model=List[schemas.Store])
def list_stores(db: Session = Depends(get_db)):
    stores = db.query(models.Store).all()
    return stores

@router.get("/{store_id}", response_model=schemas.Store)
def get_store(store_id: str, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if store is None:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

@router.post("/", response_model=schemas.Store)
def create_store(store: schemas.StoreCreate, db: Session = Depends(get_db)):
    db_store = models.Store(**store.dict())
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store

@router.post("/{store_id}/assign-recipe")
def assign_recipe_to_store(
    store_id: str, 
    recipe_version_id: str,
    db: Session = Depends(get_db)
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    version = db.query(models.RecipeVersion).filter(models.RecipeVersion.id == recipe_version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="RecipeVersion not found")
    
    # Update store's active recipe
    store.active_recipe_version_id = recipe_version_id
    store.deviation = 0.0  # Reset deviation on new assignment
    store.status = 'ACTIVE'
    
    # Create deployment record
    deployment = models.Deployment(
        org_id=store.org_id,
        recipe_version_id=recipe_version_id,
        scope='SELECTED_STORES',
        status='DEPLOYED'
    )
    db.add(deployment)
    db.commit()
    
    return {"message": "Recipe assigned successfully", "store_id": store_id, "recipe_version_id": recipe_version_id}

@router.post("/{store_id}/rollback")
def rollback_store(store_id: str, db: Session = Depends(get_db)):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Reset to no recipe
    store.active_recipe_version_id = None
    store.status = 'ACTIVE'
    db.commit()
    
    return {"message": "Store rolled back successfully", "store_id": store_id}
