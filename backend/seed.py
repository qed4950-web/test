from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from . import models
import uuid

# Ensure tables exist
models.Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # Check if data exists
    if db.query(models.Organization).first():
        print("Data already exists.")
        return

    # 1. Create Organization
    org = models.Organization(name="Joomidang HQ")
    db.add(org)
    db.commit()
    db.refresh(org)
    print(f"Created Org: {org.id}")

    # 2. Create User
    user = models.User(org_id=org.id, email="admin@joomidang.com", role="ADMIN")
    db.add(user)
    db.commit()

    # 3. Create Reference 1 (Anchor - Market Proven)
    ref1 = models.Reference(
        org_id=org.id,
        name="Famous BBQ Gangnam (Anchor)",
        reference_type="ANCHOR",
        menu_category="pork_belly",
        source_kind="MARKET"
    )
    db.add(ref1)
    db.commit()
    db.refresh(ref1)

    fp1 = models.ReferenceFingerprint(
        reference_id=ref1.id,
        version=1,
        # 12-axis: Salt, Sweet, Sour, Bitter, Umami, Fat, Crisp, Juicy, Fire, Garlic, Fermented, Spice
        vector=[85.0, 45.0, 20.0, 15.0, 120.0, 95.0, 110.0, 88.0, 130.0, 75.0, 35.0, 40.0],
        metrics_json={"addictiveness": 92, "satiety": 85, "repeat": 95},
        notes="Famous BBQ - 불향 + 감칠맛 + 바삭함 강점"
    )
    db.add(fp1)

    # 4. Create Reference 2 (Brand - Current Internal)
    ref2 = models.Reference(
        org_id=org.id,
        name="MyBrand Standard v2",
        reference_type="BRAND",
        menu_category="pork_belly",
        source_kind="INTERNAL"
    )
    db.add(ref2)
    db.commit()
    db.refresh(ref2)

    fp2 = models.ReferenceFingerprint(
        reference_id=ref2.id,
        version=1,
        # 12-axis: Salt, Sweet, Sour, Bitter, Umami, Fat, Crisp, Juicy, Fire, Garlic, Fermented, Spice
        vector=[70.0, 55.0, 25.0, 10.0, 85.0, 75.0, 65.0, 70.0, 60.0, 80.0, 45.0, 30.0],
        metrics_json={"addictiveness": 68, "satiety": 72, "repeat": 70},
        notes="MyBrand Standard - 균형 잡힌 기본맛"
    )
    db.add(fp2)

    # 5. Create Stores
    stores_data = [
        {"name": "Gangnam Station Main", "region": "Seoul", "deviation": 2.1},
        {"name": "Hongdae Playground", "region": "Seoul", "deviation": 5.8},
        {"name": "Busan Centum", "region": "Busan", "deviation": 18.3, "status": "WARNING"},
        {"name": "Jeju Airport", "region": "Jeju", "deviation": 3.4},
        {"name": "Pangyo Tech", "region": "Seongnam", "deviation": 7.2},
        {"name": "Seongsu-dong", "region": "Seoul", "deviation": 4.1},
        {"name": "Daejeon Dunsan", "region": "Daejeon", "deviation": 12.5},
        {"name": "Gwangju Chungjang", "region": "Gwangju", "deviation": 1.9},
    ]
    for s in stores_data:
        store = models.Store(
            org_id=org.id,
            name=s["name"],
            region=s.get("region"),
            deviation=s.get("deviation", 0),
            status=s.get("status", "ACTIVE")
        )
        db.add(store)

    db.commit()  # Commit stores first to get IDs
    
    # 6. Create ExecutionLogs (sample data for logs page)
    stores = db.query(models.Store).all()
    if stores:
        import random
        event_types = ['START', 'STEP', 'END', 'ERROR']
        for _ in range(20):
            store = random.choice(stores)
            event = random.choice(event_types)
            log = models.ExecutionLog(
                org_id=org.id,
                store_id=store.id,
                event_type=event,
                payload_json={
                    "action": random.choice(["seasoning", "grill", "spray", "check_temp"]),
                    "value": round(random.uniform(50, 200), 1),
                    "status": "ok" if event != 'ERROR' else "failed"
                }
            )
            db.add(log)

    db.commit()
    print("Seeding Complete.")
    db.close()

if __name__ == "__main__":
    seed_data()
