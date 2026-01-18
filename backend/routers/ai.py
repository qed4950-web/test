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
    from ..services.local_llm import generate_chat
    import json
    import re
    
    system_prompt = """당신은 F&B 맛 분석 전문가입니다.
두 레시피 간의 맛 차이를 분석하고, 왜 이 차이가 중요한지 설명해주세요.
마크다운 형식으로 분석 결과를 작성하세요."""

    user_prompt = f"""다음 맛 비교 데이터를 분석해주세요:

**레퍼런스 1 (성공 맛집)**: {req.reference1_name}
**레퍼런스 2 (내 브랜드)**: {req.reference2_name}

**맛 차이 Top 3**:
{chr(10).join([f"- {g.get('label', '미정')}: {g.get('diff', 0):+.1f}" for g in req.gap_top3])}

**중독성 차이**: {req.addictiveness_diff:+.0f}점

다음을 설명해주세요:
1. 왜 이 차이가 매출에 영향을 주는지
2. 어떤 전략(Copy/Distance/Redirect)을 추천하는지
3. 구체적인 실행 방안

다음 JSON 형식으로 응답하세요:
{{"interpretation": "마크다운 분석 텍스트", "strategy_recommendation": "추천 전략명"}}"""

    try:
        response = generate_chat([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ])
        
        if response:
            json_match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group(0))
                if result.get("interpretation") and result.get("strategy_recommendation"):
                    return InterpretResponse(
                        interpretation=str(result["interpretation"]),
                        strategy_recommendation=str(result["strategy_recommendation"]),
                    )
    except Exception as e:
        pass  # Fall through to demo response
    
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
