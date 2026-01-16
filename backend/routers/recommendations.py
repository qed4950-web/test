from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models

router = APIRouter(prefix="/v1/recommend", tags=["recommend"])


class NamingRecommendRequest(BaseModel):
    style: str


class NamingRecommendResponse(BaseModel):
    vector: List[float]
    message: str


class BattleRecommendResponse(BaseModel):
    reference_1_id: Optional[str] = None
    reference_2_id: Optional[str] = None
    mix_ratio: float
    message: str


class VibeRecommendResponse(BaseModel):
    mode: str
    era: str
    message: str


@router.post("/naming", response_model=NamingRecommendResponse)
def recommend_naming(req: NamingRecommendRequest) -> NamingRecommendResponse:
    style_profiles = {
        "premium": [0.6, 0.4, 0.8, 0.3, 0.7],
        "fun": [0.8, 0.6, 0.5, 0.7, 0.6],
        "elegant": [0.4, 0.3, 0.7, 0.4, 0.8],
    }
    vector = style_profiles.get(req.style, style_profiles["premium"])
    return NamingRecommendResponse(
        vector=vector,
        message="현재 스타일 기준으로 균형형 벡터를 추천했어요.",
    )


@router.post("/battle", response_model=BattleRecommendResponse)
def recommend_battle(db: Session = Depends(get_db)) -> BattleRecommendResponse:
    references = (
        db.query(models.Reference)
        .order_by(models.Reference.created_at.desc())
        .limit(2)
        .all()
    )
    if len(references) < 2:
        return BattleRecommendResponse(
            reference_1_id=None,
            reference_2_id=None,
            mix_ratio=0.5,
            message="레퍼런스를 2개 이상 추가하면 추천이 가능합니다.",
        )
    return BattleRecommendResponse(
        reference_1_id=references[0].id,
        reference_2_id=references[1].id,
        mix_ratio=0.5,
        message=f"{references[0].name} + {references[1].name} 조합을 추천했어요.",
    )


@router.post("/vibe", response_model=VibeRecommendResponse)
def recommend_vibe(db: Session = Depends(get_db)) -> VibeRecommendResponse:
    modes = ["Chill", "Energetic", "Focus", "Romantic"]
    eras = ["Modern", "1990s", "2000s", "2020s"]
    import random
    modes = ["Chill", "Energetic", "Focus", "Romantic"]
    eras = ["Modern", "1990s", "2000s", "2020s"]
    
    # Randomly select for better demo experience
    mode = random.choice(modes)
    era = random.choice(eras)
    
    return VibeRecommendResponse(
        mode=mode,
        era=era,
        message=f"AI가 {mode} 분위기와 {era} 시대를 추천했어요!",
    )
