from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os

router = APIRouter(
    prefix="/v1/ai",
    tags=["ai"],
)

class InterpretRequest(BaseModel):
    reference1_name: str
    reference2_name: str
    gap_top3: List[dict]  # [{label, diff}]
    addictiveness_diff: float
    selected_strategy: Optional[str] = None

class SimulationRequest(BaseModel):
    strategy: str
    flavor_profile: dict  # {fire, umami, sweet, etc.}

class InterpretResponse(BaseModel):
    interpretation: str
    strategy_recommendation: str

class SimulationResponse(BaseModel):
    personas: List[dict]

# Simulated AI responses (for demo without API key)
DEMO_INTERPRETATIONS = {
    "default": """**분석 요약**
{ref1}은 {gap1}({diff1:+.1f})와 {gap2}({diff2:+.1f})에서 강점을 보입니다.

**중독성 분석**
Target 맛집의 중독성 점수가 {addict_diff:.0f}점 높습니다. 
이는 감칠맛과 불향의 조합으로 "먹고 난 뒤 기억"을 만드는 구조 때문입니다.

**전략 제안**
Distance Reduce 전략을 권장합니다. 핵심 중독 구조(감칠맛+불향)만 가져오고 브랜드 톤을 유지하세요."""
}

DEMO_PERSONAS = [
    {
        "type": "직장인 남성",
        "quote": "처음엔 센데, 계속 손이 감",
        "repeat_rate": "중상",
        "price_resistance": "낮음",
    },
    {
        "type": "2030 여성", 
        "quote": "SNS에 올리고 싶은 비주얼",
        "repeat_rate": "중",
        "word_of_mouth": "높음",
    },
]

@router.post("/interpret", response_model=InterpretResponse)
async def interpret_distance(req: InterpretRequest):
    """AI Distance Interpretation - Level 2"""
    
    api_key = os.getenv("OPENAI_API_KEY")
    
    if api_key and api_key != "your-api-key-here":
        # Real OpenAI call would go here
        # For now, return demo response
        pass
    
    # Demo response
    gap1 = req.gap_top3[0] if len(req.gap_top3) > 0 else {"label": "감칠맛", "diff": 20}
    gap2 = req.gap_top3[1] if len(req.gap_top3) > 1 else {"label": "불향", "diff": 15}
    
    interpretation = DEMO_INTERPRETATIONS["default"].format(
        ref1=req.reference1_name,
        gap1=gap1["label"],
        diff1=gap1["diff"],
        gap2=gap2["label"],
        diff2=gap2["diff"],
        addict_diff=req.addictiveness_diff
    )
    
    recommendation = "Distance Reduce" if req.addictiveness_diff > 15 else "Copy"
    
    return InterpretResponse(
        interpretation=interpretation,
        strategy_recommendation=recommendation
    )

@router.post("/simulate", response_model=SimulationResponse)
async def simulate_customer_reaction(req: SimulationRequest):
    """AI Customer Simulation - Level 4"""
    
    api_key = os.getenv("OPENAI_API_KEY")
    
    if api_key and api_key != "your-api-key-here":
        # Real OpenAI call would go here
        pass
    
    # Demo response with customization based on strategy
    personas = DEMO_PERSONAS.copy()
    
    if req.strategy == "SIGNATURE":
        personas[0]["quote"] = "새로운데 익숙한 맛이야"
        personas[1]["quote"] = "여기만의 맛이 있어서 좋아"
    elif req.strategy == "COPY":
        personas[0]["quote"] = "어디서 먹어본 맛인데 맛있다"
        personas[1]["quote"] = "유명한 집 느낌이 나"
    
    return SimulationResponse(personas=personas)
