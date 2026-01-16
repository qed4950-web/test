from backend.models import Reference
from sqlalchemy import create_engine
from backend.database import Base
from sqlalchemy import inspect

print("DEBUG: Importing Reference...")
print(f"Reference columns in model: {Reference.__table__.columns.keys()}")

engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)
inspector = inspect(engine)
columns = [c['name'] for c in inspector.get_columns('references')]
print(f"DEBUG: references table columns in DB: {columns}")
