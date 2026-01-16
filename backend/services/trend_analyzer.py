from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend import models

AXES = ["매운맛", "단맛", "감칠맛", "상큼함", "풍미"]

def predict_trends(
    category: str,
    lookback_months: int,
    org_id: str,
    db: Session
) -> models.TrendReport:
    """
    Analyze historical data and predict flavor trends.
    """
    # 1. Get references in category created in lookback period
    cutoff = datetime.utcnow() - timedelta(days=lookback_months * 30)
    
    refs = db.query(models.Reference).filter(
        models.Reference.menu_category == category,
        models.Reference.created_at >= cutoff
    ).all()
    
    if len(refs) < 3:
        # Not enough data - create mock prediction
        predictions = [
            {"axis": "매운맛", "direction": "stable", "magnitude": 0.0, "confidence": 0.3},
            {"axis": "감칠맛", "direction": "up", "magnitude": 0.1, "confidence": 0.5}
        ]
        reasoning = f"분석 데이터 부족 ({len(refs)}개). 일반적인 트렌드 예측 적용."
        confidence = 0.4
    else:
        # Calculate trend per axis
        predictions = _calculate_axis_trends(refs)
        reasoning = _generate_reasoning(category, predictions, len(refs))
        confidence = min(0.9, 0.5 + len(refs) * 0.02)
    
    # Determine period
    now = datetime.utcnow()
    quarter = (now.month - 1) // 3 + 2  # Next quarter
    period = f"{now.year}-Q{min(4, quarter)}"
    
    # Save report
    report = models.TrendReport(
        id=models.generate_uuid(),
        org_id=org_id,
        category=category,
        period=period,
        predictions_json=predictions,
        reasoning=reasoning,
        confidence=confidence,
        data_points_count=len(refs)
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return report

def _calculate_axis_trends(refs: list) -> list:
    """Calculate trend direction for each axis"""
    # Split into early and recent
    sorted_refs = sorted(refs, key=lambda r: r.created_at)
    mid = len(sorted_refs) // 2
    
    early_refs = sorted_refs[:mid]
    recent_refs = sorted_refs[mid:]
    
    early_avg = _calc_avg_vector(early_refs)
    recent_avg = _calc_avg_vector(recent_refs)
    
    predictions = []
    for i, axis in enumerate(AXES):
        diff = recent_avg[i] - early_avg[i]
        
        if diff > 0.1:
            direction = "up"
        elif diff < -0.1:
            direction = "down"
        else:
            direction = "stable"
        
        predictions.append({
            "axis": axis,
            "direction": direction,
            "magnitude": round(abs(diff), 2),
            "confidence": round(0.6 + abs(diff), 2)
        })
    
    # Sort by magnitude (biggest changes first)
    predictions.sort(key=lambda p: p["magnitude"], reverse=True)
    
    return predictions

def _calc_avg_vector(refs: list) -> list:
    """Calculate average vector from references"""
    if not refs:
        return [0.5] * 5
    
    vectors = []
    for ref in refs:
        if ref.fingerprints and ref.fingerprints[0].vector:
            vectors.append(ref.fingerprints[0].vector[:5])
    
    if not vectors:
        return [0.5] * 5
    
    avg = [0.0] * 5
    for vec in vectors:
        for i in range(5):
            avg[i] += vec[i] / len(vectors)
    
    return avg

def _generate_reasoning(category: str, predictions: list, data_count: int) -> str:
    """Generate human-readable trend reasoning"""
    up_trends = [p for p in predictions if p["direction"] == "up"]
    down_trends = [p for p in predictions if p["direction"] == "down"]
    
    lines = [f"**{category} 카테고리 트렌드 분석** ({data_count}개 데이터 기반)"]
    
    if up_trends:
        axes = ", ".join([p["axis"] for p in up_trends[:2]])
        lines.append(f"\n📈 **상승 트렌드**: {axes}")
    
    if down_trends:
        axes = ", ".join([p["axis"] for p in down_trends[:2]])
        lines.append(f"📉 **하락 트렌드**: {axes}")
    
    # Recommendation
    if up_trends:
        top = up_trends[0]
        lines.append(f"\n**권장**: {top['axis']} 강화 (+{top['magnitude']:.0%}) 고려")
    
    return "\n".join(lines)

def auto_search_strategy(
    base_reference_id: str,
    target_kpi: dict,
    constraints: dict,
    org_id: str,
    db: Session
) -> dict:
    """
    Automatically search for optimal strategy to meet KPI targets.
    """
    from backend.services.strategy_analyzer import analyze_strategy
    
    # Get base reference
    base_ref = db.query(models.Reference).filter(models.Reference.id == base_reference_id).first()
    if not base_ref:
        raise ValueError("Base reference not found")
    
    # Get all competitors in same category
    competitors = db.query(models.Reference).filter(
        models.Reference.menu_category == base_ref.menu_category,
        models.Reference.reference_type == "BRAND",
        models.Reference.id != base_reference_id
    ).limit(5).all()
    
    if not competitors:
        raise ValueError("No competitors found for analysis")
    
    # Try different strategies
    best_result = None
    best_score = -1
    
    strategies_tried = []
    
    for goal in ["differentiate", "increase_sales", "reduce_cost"]:
        try:
            from backend import schemas
            goal_enum = getattr(schemas.StrategyGoal, goal.upper())
            
            report = analyze_strategy(
                anchor_id=base_reference_id,
                competitor_ids=[c.id for c in competitors[:3]],
                goal=goal_enum,
                org_id=org_id,
                db=db
            )
            
            # Score based on target KPI
            score = _score_strategy(report, target_kpi, constraints)
            
            strategies_tried.append({
                "goal": goal,
                "mode": report.recommended_mode,
                "alpha": float(report.recommended_alpha),
                "score": score,
                "predicted_kpi": report.kpi_predictions
            })
            
            if score > best_score:
                best_score = score
                best_result = report
                
        except Exception as e:
            strategies_tried.append({
                "goal": goal,
                "error": str(e)
            })
    
    if not best_result:
        raise ValueError("No valid strategies found")
    
    return {
        "optimal_strategy": {
            "mode": best_result.recommended_mode,
            "alpha": float(best_result.recommended_alpha),
            "target_id": best_result.recommended_target_id
        },
        "predicted_kpi": best_result.kpi_predictions,
        "confidence": float(best_result.confidence),
        "search_iterations": len(strategies_tried),
        "alternatives": [s for s in strategies_tried if "error" not in s][:3]
    }

def _score_strategy(report, target_kpi: dict, constraints: dict) -> float:
    """Score a strategy based on how well it meets targets"""
    score = 0.5  # Base score
    
    kpi = report.kpi_predictions
    
    # Check target KPI
    if "sales_lift" in target_kpi and kpi.get("sales_lift"):
        if kpi["sales_lift"] >= target_kpi["sales_lift"]:
            score += 0.3
    
    # Check constraints
    risk_tolerance = constraints.get("risk_tolerance", "medium")
    brand_conflict = report.risk_scores.get("brand_conflict", 0)
    
    if risk_tolerance == "low" and brand_conflict < 0.3:
        score += 0.2
    elif risk_tolerance == "high":
        score += 0.1
    
    return min(1.0, score)

def record_dna_evolution(
    brand_id: str,
    event_type: str,
    notes: str,
    db: Session
) -> models.DNAEvolution:
    """Record a DNA evolution snapshot"""
    # Get current vector
    ref = db.query(models.Reference).filter(models.Reference.id == brand_id).first()
    if not ref:
        raise ValueError("Brand not found")
    
    vector = [0.5] * 5
    if ref.fingerprints:
        vector = ref.fingerprints[0].vector[:5]
    
    evolution = models.DNAEvolution(
        id=models.generate_uuid(),
        brand_id=brand_id,
        vector_snapshot=vector,
        event_type=event_type,
        notes=notes
    )
    
    db.add(evolution)
    db.commit()
    db.refresh(evolution)
    
    return evolution

def get_dna_evolution_timeline(
    brand_id: str,
    db: Session
) -> dict:
    """Get DNA evolution timeline for a brand"""
    evolutions = db.query(models.DNAEvolution).filter(
        models.DNAEvolution.brand_id == brand_id
    ).order_by(models.DNAEvolution.created_at).all()
    
    if not evolutions:
        return {"timeline": [], "total_drift": 0, "significant_shifts": []}
    
    timeline = []
    prev_vector = None
    significant_shifts = []
    
    for evo in evolutions:
        entry = {
            "date": evo.created_at.strftime("%Y-%m-%d"),
            "vector": evo.vector_snapshot,
            "event": evo.event_type,
            "notes": evo.notes
        }
        
        if prev_vector:
            delta = [abs(evo.vector_snapshot[i] - prev_vector[i]) for i in range(5)]
            entry["delta"] = delta
            
            # Check for significant shifts (>0.2)
            for i, d in enumerate(delta):
                if d > 0.2:
                    significant_shifts.append({
                        "date": entry["date"],
                        "axis": AXES[i],
                        "magnitude": round(d, 2)
                    })
        
        timeline.append(entry)
        prev_vector = evo.vector_snapshot
    
    # Calculate total drift
    if len(evolutions) >= 2:
        first_vec = evolutions[0].vector_snapshot
        last_vec = evolutions[-1].vector_snapshot
        total_drift = sum([abs(last_vec[i] - first_vec[i]) for i in range(5)])
    else:
        total_drift = 0
    
    return {
        "timeline": timeline,
        "total_drift": round(total_drift, 2),
        "significant_shifts": significant_shifts
    }
