from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend import models, schemas
from backend.database import get_db
from backend.services.signature_inventor import calculate_conflict_map

router = APIRouter(
    prefix="/v1/analysis",
    tags=["analysis"],
)

@router.post("/conflict-map", response_model=schemas.ConflictMapResponse)
def get_conflict_map(
    request: schemas.ConflictMapRequest,
    db: Session = Depends(get_db)
):
    """
    Calculate flavor conflict/overlap between brand and competitors.
    
    Returns:
    - conflict_zones: Axes with high overlap (need differentiation)
    - unique_zones: Axes with low overlap (can be strengthened)
    - overall_similarity: Total similarity score
    """
    try:
        result = calculate_conflict_map(
            brand_id=request.brand_id,
            competitor_ids=request.competitor_ids,
            db=db
        )
        
        return schemas.ConflictMapResponse(
            conflict_zones=[schemas.ConflictZone(**z) for z in result["conflict_zones"]],
            unique_zones=[schemas.ConflictZone(**z) for z in result["unique_zones"]],
            overall_similarity=result["overall_similarity"]
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
