from sqlalchemy.orm import Session
from sqlalchemy import func
from backend import models, schemas
import statistics
import logging

logger = logging.getLogger(__name__)

AXES = ["매운맛", "단맛", "감칠맛", "상큼함", "풍미"]

def analyze_strategy(
    anchor_id: str,
    competitor_ids: list[str],
    goal: schemas.StrategyGoal,
    org_id: str,
    db: Session
) -> models.StrategyReport:
    """
    Analyze competitors and recommend optimal strategy.
    Returns strategy with KPI predictions, risks, and reasoning.
    """
    # 1. Get anchor reference
    anchor = db.query(models.Reference).filter(models.Reference.id == anchor_id).first()
    if not anchor:
        raise ValueError(f"Anchor {anchor_id} not found")
    
    anchor_vector = _get_vector(anchor)
    
    # 2. Get competitor vectors
    competitors = []
    for cid in competitor_ids:
        comp = db.query(models.Reference).filter(models.Reference.id == cid).first()
        if comp:
            competitors.append({
                "id": cid,
                "name": comp.name,
                "vector": _get_vector(comp)
            })
    
    if not competitors:
        raise ValueError("No valid competitors found")
    
    # 3. Calculate best strategy based on goal
    strategy = _calculate_optimal_strategy(anchor_vector, competitors, goal)
    
    # 4. Calculate KPI predictions
    kpi = _predict_kpi(anchor_vector, strategy, competitors, goal)
    
    # 5. Calculate risk scores
    risks = _calculate_risks(anchor_vector, strategy, competitors)
    
    # 6. Generate reasoning
    reasoning = _generate_reasoning(anchor.name, strategy, competitors, goal, kpi, risks)
    
    # 7. Calculate confidence
    confidence = _calculate_confidence(len(competitors), strategy)
    
    # 8. Save report
    report = models.StrategyReport(
        id=models.generate_uuid(),
        org_id=org_id,
        anchor_id=anchor_id,
        recommended_mode=strategy["mode"],
        recommended_alpha=strategy["alpha"],
        recommended_target_id=strategy.get("target_id"),
        kpi_predictions=kpi,
        risk_scores=risks,
        reasoning=reasoning,
        confidence=confidence
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return report

def _get_vector(ref: models.Reference) -> list:
    default_vector = [0.5] * 5
    if ref.fingerprints and ref.fingerprints[0].vector:
        vec = ref.fingerprints[0].vector
        if len(vec) < 5:
            return vec + [0.5] * (5 - len(vec))
        return vec[:5]
    return default_vector

def _calculate_optimal_strategy(anchor: list, competitors: list, goal: schemas.StrategyGoal) -> dict:
    """Determine best mode and alpha based on goal"""
    
    # Calculate average competitor vector
    avg_comp = [0] * 5
    for c in competitors:
        for i in range(5):
            avg_comp[i] += c["vector"][i] / len(competitors)
    
    # Calculate distance from anchor to average competitor
    distance = sum([(anchor[i] - avg_comp[i])**2 for i in range(5)]) ** 0.5
    
    # Find most different competitor (for DISTANCE mode target)
    max_diff_id = None
    max_diff = 0
    for c in competitors:
        diff = sum([(anchor[i] - c["vector"][i])**2 for i in range(5)]) ** 0.5
        if diff > max_diff:
            max_diff = diff
            max_diff_id = c["id"]
    
    if goal == schemas.StrategyGoal.DIFFERENTIATE:
        # Move away from competitors
        return {"mode": "REDIRECT", "alpha": min(0.7, distance + 0.3), "target_id": max_diff_id}
    elif goal == schemas.StrategyGoal.INCREASE_SALES:
        # Move toward popular competitor
        return {"mode": "DISTANCE", "alpha": 0.5, "target_id": max_diff_id}
    else:  # REDUCE_COST
        # Stay close to anchor
        return {"mode": "COPY", "alpha": 0.2, "target_id": None}

def _predict_kpi(anchor: list, strategy: dict, competitors: list, goal: schemas.StrategyGoal) -> dict:
    """Predict KPI improvements"""
    base_lift = 0.05
    
    if goal == schemas.StrategyGoal.INCREASE_SALES:
        sales_lift = base_lift + (strategy["alpha"] * 0.15)
        cost_delta = strategy["alpha"] * 0.05
    elif goal == schemas.StrategyGoal.REDUCE_COST:
        sales_lift = -0.02
        cost_delta = -0.1
    else:
        sales_lift = base_lift + 0.05
        cost_delta = 0.02
    
    # Uniqueness score based on distance from competitors
    uniqueness = min(1.0, strategy["alpha"] * 1.2)
    
    return {
        "sales_lift": round(sales_lift, 3),
        "cost_delta": round(cost_delta, 3),
        "uniqueness_score": round(uniqueness, 3)
    }

def _calculate_risks(anchor: list, strategy: dict, competitors: list) -> dict:
    """Calculate risk scores"""
    alpha = strategy["alpha"]
    
    # Brand conflict: higher alpha = more change = more risk
    brand_conflict = alpha * 0.5
    
    # Price mismatch: significant changes may need price adjustment
    price_mismatch = alpha * 0.3 if strategy["mode"] != "COPY" else 0.1
    
    # Execution difficulty
    exec_difficulty = 0.2 + (alpha * 0.4)
    
    return {
        "brand_conflict": round(brand_conflict, 2),
        "price_mismatch": round(price_mismatch, 2),
        "execution_difficulty": round(exec_difficulty, 2)
    }

def _generate_reasoning(anchor_name: str, strategy: dict, competitors: list, 
                       goal: schemas.StrategyGoal, kpi: dict, risks: dict) -> str:
    """Generate human-readable reasoning - tries LLM first, falls back to rule-based"""
    
    # Try LLM-based reasoning first
    llm_reasoning = _generate_reasoning_with_llm(anchor_name, strategy, competitors, goal, kpi, risks)
    if llm_reasoning:
        return llm_reasoning
    
    # Fallback to rule-based reasoning
    return _generate_reasoning_rule_based(anchor_name, strategy, competitors, goal, kpi, risks)


def _generate_reasoning_with_llm(anchor_name: str, strategy: dict, competitors: list, 
                                  goal: schemas.StrategyGoal, kpi: dict, risks: dict) -> str | None:
    """Generate reasoning using LLM for more nuanced explanations"""
    try:
        from backend.services.local_llm import generate_chat
        
        mode_desc = {
            "COPY": "복제 전략 (성공 공식 그대로 적용)",
            "DISTANCE": "거리 조절 전략 (핵심 유지, 차별화)",
            "REDIRECT": "방향 전환 전략 (경쟁 회피, 새로운 포지셔닝)"
        }
        
        goal_desc = {
            schemas.StrategyGoal.INCREASE_SALES: "매출 증대",
            schemas.StrategyGoal.REDUCE_COST: "비용 절감",
            schemas.StrategyGoal.DIFFERENTIATE: "브랜드 차별화"
        }
        
        comp_names = ", ".join([c["name"] for c in competitors[:3]])
        
        system_prompt = """당신은 F&B 전략 컨설턴트입니다. 
레시피 전략 분석 결과를 바탕으로 명확하고 실행 가능한 조언을 제공하세요.
응답은 한국어로, 마크다운 형식으로 작성하세요."""

        user_prompt = f"""다음 분석 결과를 바탕으로 전략 추천 이유를 설명해주세요:

**대상 메뉴**: {anchor_name}
**비교 경쟁사**: {comp_names}
**목표**: {goal_desc.get(goal, str(goal))}
**추천 전략**: {mode_desc.get(strategy['mode'], strategy['mode'])} (강도: {strategy['alpha']:.0%})

**예상 KPI**:
- 매출 변화: {kpi.get('sales_lift', 0):+.1%}
- 비용 변화: {kpi.get('cost_delta', 0):+.1%}
- 차별화 점수: {kpi.get('uniqueness_score', 0):.1%}

**리스크**:
- 브랜드 충돌: {risks.get('brand_conflict', 0):.0%}
- 가격 미스매치: {risks.get('price_mismatch', 0):.0%}

왜 이 전략이 최적인지, 실행 시 주의사항은 무엇인지 간결하게 설명해주세요."""

        response = generate_chat([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        
        if response and len(response) > 50:
            return response
        return None
        
    except Exception as e:
        logger.warning(f"LLM reasoning failed: {e}")
        return None


def _generate_reasoning_rule_based(anchor_name: str, strategy: dict, competitors: list, 
                                    goal: schemas.StrategyGoal, kpi: dict, risks: dict) -> str:
    """Fallback rule-based reasoning generation"""
    
    mode_desc = {
        "COPY": "현재 맛을 유지하면서 미세 조정",
        "DISTANCE": "경쟁사 방향으로 적극적 이동",
        "REDIRECT": "경쟁사와 반대 방향으로 차별화"
    }
    
    goal_desc = {
        schemas.StrategyGoal.INCREASE_SALES: "매출 증대",
        schemas.StrategyGoal.REDUCE_COST: "비용 절감",
        schemas.StrategyGoal.DIFFERENTIATE: "차별화"
    }
    
    comp_names = ", ".join([c["name"] for c in competitors[:3]])
    
    reasoning = f"""
**분석 대상**: {anchor_name}
**비교 경쟁사**: {comp_names}
**목표**: {goal_desc[goal]}

**추천 전략**: {mode_desc[strategy['mode']]} (강도: {strategy['alpha']:.0%})

**예상 효과**:
- 매출 변화: {kpi['sales_lift']:+.1%}
- 비용 변화: {kpi['cost_delta']:+.1%}
- 차별화 점수: {kpi['uniqueness_score']:.1%}

**리스크 분석**:
- 브랜드 충돌 위험: {risks['brand_conflict']:.0%}
- 가격 조정 필요성: {risks['price_mismatch']:.0%}
"""
    return reasoning.strip()

def _calculate_confidence(num_competitors: int, strategy: dict) -> float:
    """Calculate overall confidence score"""
    # More data = more confidence
    data_confidence = min(1.0, num_competitors * 0.3)
    # Lower alpha = more predictable = higher confidence
    strategy_confidence = 1.0 - (strategy["alpha"] * 0.3)
    
    return round((data_confidence + strategy_confidence) / 2, 2)

import json
import time

def analyze_strategy_generator(
    anchor_id: str,
    competitor_ids: list[str],
    goal: schemas.StrategyGoal,
    org_id: str,
    db: Session
):
    """
    Generator for streaming analysis. Yields SSE events.
    Events: progress, reasoning_token, complete, error
    """
    try:
        # 1. Progress: Start
        yield f"data: {json.dumps({'type': 'progress', 'message': '데이터 로딩 중...'})}\n\n"
        time.sleep(0.5)

        anchor = db.query(models.Reference).filter(models.Reference.id == anchor_id).first()
        if not anchor:
            raise ValueError(f"Anchor {anchor_id} not found")
        
        anchor_vector = _get_vector(anchor)
        
        competitors = []
        for cid in competitor_ids:
            comp = db.query(models.Reference).filter(models.Reference.id == cid).first()
            if comp:
                competitors.append({
                    "id": cid,
                    "name": comp.name,
                    "vector": _get_vector(comp)
                })
        
        if not competitors:
            raise ValueError("No valid competitors found")
        
        # 2. Progress: Analysis
        yield f"data: {json.dumps({'type': 'progress', 'message': '벡터 공간 분석 및 전략 수립 중...'})}\n\n"
        time.sleep(0.8)

        strategy = _calculate_optimal_strategy(anchor_vector, competitors, goal)
        kpi = _predict_kpi(anchor_vector, strategy, competitors, goal)
        risks = _calculate_risks(anchor_vector, strategy, competitors)
        
        # 3. Stream Reasoning (Simulate LLM)
        yield f"data: {json.dumps({'type': 'progress', 'message': '전략 리포트 생성 중...'})}\n\n"
        
        full_reasoning = _generate_reasoning(anchor.name, strategy, competitors, goal, kpi, risks)
        
        # Stream character by character with slight delay
        for char in full_reasoning:
            yield f"data: {json.dumps({'type': 'token', 'text': char})}\n\n"
            time.sleep(0.01)  # 10ms delay per char for typing effect
        
        confidence = _calculate_confidence(len(competitors), strategy)
        
        # Save to DB (Full logic)
        report = models.StrategyReport(
            id=models.generate_uuid(),
            org_id=org_id,
            anchor_id=anchor_id,
            recommended_mode=strategy["mode"],
            recommended_alpha=strategy["alpha"],
            recommended_target_id=strategy.get("target_id"),
            kpi_predictions=kpi,
            risk_scores=risks,
            reasoning=full_reasoning,
            confidence=confidence
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        
        # 4. Complete
        result_data = schemas.StrategyReport(
            id=report.id,
            org_id=report.org_id,
            anchor_id=report.anchor_id,
            recommended_strategy=schemas.RecommendedStrategy(
                mode=report.recommended_mode,
                alpha=float(report.recommended_alpha),
                target_id=report.recommended_target_id
            ),
            kpi_predictions=schemas.KPIPrediction(**report.kpi_predictions),
            risk_scores=schemas.RiskScores(**report.risk_scores),
            reasoning=report.reasoning,
            confidence=float(report.confidence),
            created_at=report.created_at
        ).dict()
        
        # Convert datetime objects to string for JSON serialization
        if result_data.get('created_at'):
            result_data['created_at'] = result_data['created_at'].isoformat()

        yield f"data: {json.dumps({'type': 'complete', 'result': result_data})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
