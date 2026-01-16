from sqlalchemy.orm import Session
from backend import models, schemas
from backend.services.llm_reliability import llm_service
import json

# Flavor axis names
AXES = ["매운맛", "단맛", "감칠맛", "상큼함", "풍미"]

REVERSE_ENGINEER_PROMPT = """
당신은 음식 맛 분석 전문가입니다.
아래 정보를 바탕으로 이 음식의 "맛 구조"를 역설계하세요.

**입력 데이터:**
- 메뉴명: {name}
- 카테고리: {category}
- 맛 벡터: {vector_str}
  (순서: 매운맛, 단맛, 감칠맛, 상큼함, 풍미)
- 키워드: {keywords}

**분석 요청:**
1. structure_summary: 핵심 맛 구조를 "X% + Y% + Z%" 형태로 요약
2. primary_factors: 주요 맛 요소 3개와 각 기여도
3. cooking_params: 추정 조리 파라미터 (불 강도, 조리 시간 등)
4. confidence: 분석 신뢰도 (0-1)

**반드시 아래 JSON 형식으로만 응답:**
{{
  "structure_summary": "불향 40% + 감칠맛 35% + 짠맛 25%",
  "primary_factors": [
    {{"name": "불향", "contribution": 0.4}},
    {{"name": "감칠맛", "contribution": 0.35}},
    {{"name": "짠맛", "contribution": 0.25}}
  ],
  "cooking_params": {{"fire_intensity": 0.8, "oil_temp_c": 180, "cook_time_sec": 120}},
  "confidence": 0.85
}}
"""

def reverse_engineer_reference(reference_id: str, db: Session) -> models.ReverseAnalysis:
    """
    Analyze a reference's flavor structure using LLM.
    """
    # 1. Get reference data
    ref = db.query(models.Reference).filter(models.Reference.id == reference_id).first()
    if not ref:
        raise ValueError(f"Reference {reference_id} not found")
    
    # Get fingerprint vector
    vector = [0.5] * 5
    if ref.fingerprints:
        vector = ref.fingerprints[0].vector or vector
    
    # Get keywords
    keywords = []
    if ref.metadata_json and 'keywords' in ref.metadata_json:
        keywords = ref.metadata_json['keywords']
    
    # 2. Format prompt
    vector_str = ", ".join([f"{AXES[i]}={v:.2f}" for i, v in enumerate(vector[:5])])
    prompt = REVERSE_ENGINEER_PROMPT.format(
        name=ref.name,
        category=ref.menu_category,
        vector_str=vector_str,
        keywords=", ".join(keywords) if keywords else "없음"
    )
    
    # 3. Call LLM (with fallback)
    try:
        response = llm_service.safe_generate(prompt)
        # Parse JSON from response
        if isinstance(response, dict) and 'content' in response:
            result = json.loads(response['content'])
        elif isinstance(response, dict):
            result = response
        else:
            result = json.loads(response)
    except Exception as e:
        # Fallback: Rule-based analysis
        result = _rule_based_analysis(vector, ref.name)
    
    # 4. Save result
    analysis = models.ReverseAnalysis(
        id=models.generate_uuid(),
        reference_id=reference_id,
        structure_summary=result.get("structure_summary", "분석 불가"),
        cooking_factors=result.get("cooking_params"),
        texture_contributions={"estimated": True},
        aroma_contributions={"estimated": True},
        confidence=result.get("confidence", 0.5)
    )
    
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    return analysis

def _rule_based_analysis(vector: list, name: str) -> dict:
    """
    Fallback rule-based analysis when LLM fails.
    """
    # Sort axes by value
    indexed = [(AXES[i], vector[i]) for i in range(min(5, len(vector)))]
    sorted_axes = sorted(indexed, key=lambda x: x[1], reverse=True)
    
    # Top 3 contributions
    total = sum([x[1] for x in sorted_axes[:3]])
    factors = []
    for axis, val in sorted_axes[:3]:
        pct = (val / total) * 100 if total > 0 else 33.3
        factors.append({"name": axis, "contribution": round(pct / 100, 2)})
    
    # Summary
    summary_parts = [f"{f['name']} {int(f['contribution']*100)}%" for f in factors]
    summary = " + ".join(summary_parts)
    
    # Estimate cooking params based on vector
    fire = 0.5 + (vector[0] * 0.4)  # Spicy -> more fire
    
    return {
        "structure_summary": summary,
        "primary_factors": factors,
        "cooking_params": {
            "fire_intensity": round(fire, 2),
            "oil_temp_c": 170 + int(vector[0] * 30),
            "cook_time_sec": 90 + int(vector[4] * 60)
        },
        "confidence": 0.7
    }
