from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models
from ..database import get_db

router = APIRouter(
    prefix="/v1/alerts",
    tags=["alerts"],
)

@router.get("/")
def list_alerts(db: Session = Depends(get_db)):
    """전체 Alert 조회 (미해결 우선)"""
    alerts = db.query(models.Alert).order_by(
        models.Alert.is_resolved,
        models.Alert.created_at.desc()
    ).limit(50).all()
    return alerts

@router.post("/check-deviations")
def check_deviation_alerts(db: Session = Depends(get_db)):
    """모든 매장 편차 확인 및 15% 초과 시 Alert 자동 생성"""
    stores = db.query(models.Store).all()
    created_count = 0
    
    for store in stores:
        deviation = float(store.deviation) if store.deviation else 0
        
        if deviation > 15:
            # 이미 미해결 Alert이 있는지 확인
            existing = db.query(models.Alert).filter(
                models.Alert.store_id == store.id,
                models.Alert.alert_type == 'DEVIATION_HIGH',
                models.Alert.is_resolved == 0
            ).first()
            
            if not existing:
                severity = 'CRITICAL' if deviation > 25 else 'HIGH' if deviation > 20 else 'MEDIUM'
                alert = models.Alert(
                    org_id=store.org_id,
                    store_id=store.id,
                    alert_type='DEVIATION_HIGH',
                    severity=severity,
                    message=f"{store.name} 편차 {deviation:.1f}% - 즉시 점검 필요"
                )
                db.add(alert)
                created_count += 1
    
    db.commit()
    return {"message": f"{created_count} new alerts created", "total_checked": len(stores)}

@router.post("/{alert_id}/resolve")
def resolve_alert(alert_id: str, db: Session = Depends(get_db)):
    """Alert 해결 처리"""
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_resolved = 1
    db.commit()
    return {"message": "Alert resolved", "alert_id": alert_id}
