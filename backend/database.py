import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# FIXED: removed accidental "DATABASE_URL=" prefix from default value
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:shelja4311@localhost:5434/retail_forecaster"
)

engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
