import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("railpulse.db")

Base = declarative_base()

def get_database_engine():
    if settings.has_postgres:
        try:
            logger.info("Connecting to PostgreSQL database: %s", settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "configured")
            engine = create_engine(
                settings.DATABASE_URL,
                pool_size=10,
                max_overflow=20,
                pool_timeout=30,
                pool_recycle=1800,
                pool_pre_ping=True
            )
            # Test connection
            with engine.connect() as conn:
                pass
            return engine, "POSTGRESQL"
        except Exception as e:
            logger.warning("Failed to connect to PostgreSQL (%s). Falling back to SQLite local database.", e)
    
    # SQLite fallback
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "railpulse_local.db")
    sqlite_url = f"sqlite:///{db_path}"
    logger.info("Using SQLite database engine at %s (Simulation/Demo Persistence)", db_path)
    engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False}
    )
    return engine, "SQLITE_FALLBACK"

engine, DB_ENGINE_TYPE = get_database_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
