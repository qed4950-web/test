from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from backend.services.local_llm import generate_json
import random

router = APIRouter(
    prefix="/v1/tasting",
    tags=["tasting"],
)

class TastingRequest(BaseModel):
    menu_name: str
    description: str
    ingredients: List[str]

class Review(BaseModel):
    persona: str
    age_group: str
    rating: float
    comment: str
    sentiment: str # positive, neutral, negative

class TastingResponse(BaseModel):
    reviews: List[Review]
    overall_sentiment: str
    improvement_suggestion: str

DEMO_REVIEWS = [
    {
        "persona": "가성비 따지는 대학생",
        "age_group": "20대",
        "rating": 4.5,
        "comment": "와 이거 진짜 미쳤는데요? 특히 소스 맛이 계속 생각나요. 가격만 비싸지 않으면 맨날 먹을 듯.",
        "sentiment": "positive"
    },
    {
        "persona": "트렌드 민감 힙스터",
        "age_group": "20대",
        "rating": 3.0,
        "comment": "맛은 있는데... 요즘 유행하는 스타일이랑은 조금 거리가 있어요. 비주얼적으로 킥이 부족한 느낌?",
        "sentiment": "neutral"
    },
    {
        "persona": "정통파 미식가",
        "age_group": "40대",
        "rating": 2.5,
        "comment": "재료들의 조화가 아쉽습니다. 훈제 향이 너무 강해서 소고기 본연의 맛을 가리고 있어요. 밸런스 조정이 시급합니다.",
        "sentiment": "negative"
    },
    {
        "persona": "다이어터",
        "age_group": "30대",
        "rating": 3.5,
        "comment": "맛있긴 한데 칼로리 폭탄일 것 같아서 죄책감 드네요. 야채 비중을 좀 더 높여주면 좋을 것 같아요.",
        "sentiment": "neutral"
    },
    {
        "persona": "매운맛 매니아",
        "age_group": "30대",
        "rating": 5.0,
        "comment": "이거지! 끝맛에 올라오는 알싸함이 예술입니다. 스트레스 풀리는 맛이에요.",
        "sentiment": "positive"
    }
]

@router.post("/simulate", response_model=TastingResponse)
async def simulate_tasting(req: TastingRequest):
    prompt = f"""
    당신은 가상 시식회 진행자입니다. 다음 메뉴에 대해 5명의 서로 다른 페르소나가 솔직하고 날카로운 평가를 내리는 시뮬레이션을 진행해주세요.
    
    메뉴 정보:
    - 이름: {req.menu_name}
    - 설명: {req.description}
    - 재료: {", ".join(req.ingredients)}
    
    페르소나 목록:
    1. 가성비 따지는 대학생 (20대)
    2. 트렌드 민감 힙스터 (20대)
    3. 정통파 미식가 (40대)
    4. 다이어터 (30대)
    5. 매운맛 매니아 (30대)
    
    각 페르소나는 자신의 성향에 맞춰 말투와 관점을 다르게 하여 평가해야 합니다. 비판적인 의견도 가감 없이 포함해주세요.
    응답은 반드시 JSON 형식으로, 다음 키를 포함해야 합니다: reviews (리스트), overall_sentiment (요약), improvement_suggestion (개선점).
    """

    try:
        # Try LLM generation
        result = await generate_json(prompt)
        # Validate result structure roughly (fallback if fails)
        if "reviews" not in result:
            raise Exception("Invalid LLM response")
        return result
    except Exception as e:
        print(f"LLM generation failed: {e}. Using demo data.")
        return TastingResponse(
            reviews=DEMO_REVIEWS,
            overall_sentiment="대체로 긍정적이나 호불호가 갈림",
            improvement_suggestion="훈제 향의 강도를 조금 낮추고 비주얼적 요소를 보강하면 더 넓은 타겟층을 공략할 수 있습니다."
        )
