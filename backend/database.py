import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# FIXED: removed accidental "DATABASE_URL=" prefix from default value
DATABASE_URL = os.getenv("DATABASE_URL")


# def ensure_database_exists(db_url: str) -> None:
#     url = make_url(db_url)

#     # Only applies to PostgreSQL URLs.
#     if url.get_backend_name() != "postgresql":
#         return

#     db_name = url.database
#     if not db_name:
#         return

#     admin_url = url.set(database="postgres")
#     admin_engine = create_engine(admin_url, future=True, isolation_level="AUTOCOMMIT")

#     try:
#         with admin_engine.connect() as conn:
#             exists = conn.execute(
#                 text("SELECT 1 FROM pg_database WHERE datname = :name"),
#                 {"name": db_name},
#             ).scalar()

#             if not exists:
#                 safe_db_name = db_name.replace('"', '""')
#                 conn.execute(text(f'CREATE DATABASE "{safe_db_name}"'))
#     finally:
#         admin_engine.dispose()


# ensure_database_exists(DATABASE_URL)

engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
