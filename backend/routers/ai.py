from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from ..services.local_llm import generate_json

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
    
    system_prompt = (
        "You are a culinary analytics assistant. "
        "Return JSON only with keys: interpretation, strategy_recommendation."
    )
    user_prompt = (
        "Interpret the flavor gap and recommend a strategy.\n"
        f"Reference 1: {req.reference1_name}\n"
        f"Reference 2: {req.reference2_name}\n"
        f"Gap Top3: {req.gap_top3}\n"
        f"Addictiveness Diff: {req.addictiveness_diff}\n"
        f"Selected Strategy: {req.selected_strategy or ''}\n"
        "Output JSON with:\n"
        "- interpretation: short markdown analysis\n"
        "- strategy_recommendation: short label"
    )

    llm_response = generate_json([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ])
    if isinstance(llm_response, dict):
        interpretation = llm_response.get("interpretation")
        recommendation = llm_response.get("strategy_recommendation")
        if interpretation and recommendation:
            return InterpretResponse(
                interpretation=str(interpretation),
                strategy_recommendation=str(recommendation),
            )
    
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
    
    system_prompt = (
        "You are a customer insight simulator. "
        "Return JSON only with a key: personas (list)."
    )
    user_prompt = (
        "Simulate customer reactions to a menu strategy.\n"
        f"Strategy: {req.strategy}\n"
        f"Flavor Profile: {req.flavor_profile}\n"
        "Output JSON with:\n"
        "- personas: list of {type, quote, repeat_rate?, price_resistance?, word_of_mouth?}"
    )

    llm_response = generate_json([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ])
    if isinstance(llm_response, dict):
        personas = llm_response.get("personas")
        if isinstance(personas, list) and personas:
            return SimulationResponse(personas=personas)
    
    # Demo response with customization based on strategy
    personas = DEMO_PERSONAS.copy()
    
    
    if req.strategy == "SIGNATURE":
        personas[0]["quote"] = "새로운데 익숙한 맛이야"
        personas[1]["quote"] = "여기만의 맛이 있어서 좋아"
    elif req.strategy == "COPY":
        personas[0]["quote"] = "어디서 먹어본 맛인데 맛있다"
        personas[1]["quote"] = "유명한 집 느낌이 나"
    
    return SimulationResponse(personas=personas)

# --- Level 5: Recipe Mutation ---
from ..services.mutation_service import mutate_recipe

class MutationRequest(BaseModel):
    recipe: dict # Full recipe object
    strategy: str # e.g. "Spicy", "Vegan", "Premium"
    intensity: int = 50 # 0-100

class MutationResponse(BaseModel):
    mutated_recipe: dict

@router.post("/mutate", response_model=MutationResponse)
async def mutate_recipe_endpoint(req: MutationRequest):
    """AI Recipe Mutation - Level 5"""
    result = mutate_recipe(req.recipe, req.strategy, req.intensity)
    return MutationResponse(mutated_recipe=result)
