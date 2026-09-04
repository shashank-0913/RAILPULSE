import os
from typing import List
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

class Settings:
    # RailRadar Live Railway Data
    RAILRADAR_API_KEY: str = os.getenv("RAILRADAR_API_KEY", "").strip()
    RAILRADAR_BASE_URL: str = os.getenv("RAILRADAR_BASE_URL", "https://api.railradar.in").strip().rstrip("/")
    
    # OpenWeather
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "").strip()
    OPENWEATHER_BASE_URL: str = os.getenv("OPENWEATHER_BASE_URL", "https://api.openweathermap.org/data/2.5").strip().rstrip("/")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "").strip()

    # Government Identity Verification APIs (UIDAI, NSDL, Passport Seva Gateway)
    AADHAAR_VERIFICATION_API_KEY: str = os.getenv("AADHAAR_VERIFICATION_API_KEY", "").strip()
    PAN_VERIFICATION_API_KEY: str = os.getenv("PAN_VERIFICATION_API_KEY", "").strip()
    PASSPORT_VERIFICATION_API_KEY: str = os.getenv("PASSPORT_VERIFICATION_API_KEY", "").strip()
    IDENTITY_GATEWAY_URL: str = os.getenv("IDENTITY_GATEWAY_URL", "https://api.sandbox.co.in/kyc").strip().rstrip("/")
    
    # Application & Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").strip()
    LIVE_UPDATE_INTERVAL_SECONDS: int = int(os.getenv("LIVE_UPDATE_INTERVAL_SECONDS", "60"))
    
    # CORS
    _cors_env: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
    CORS_ORIGINS: List[str] = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]

    @property
    def has_railradar(self) -> bool:
        return bool(self.RAILRADAR_API_KEY and len(self.RAILRADAR_API_KEY) > 5)

    @property
    def has_openweather(self) -> bool:
        return bool(self.OPENWEATHER_API_KEY and len(self.OPENWEATHER_API_KEY) > 5)

    @property
    def has_postgres(self) -> bool:
        return bool(self.DATABASE_URL and ("postgresql://" in self.DATABASE_URL or "postgres://" in self.DATABASE_URL))

    @property
    def has_aadhaar_api(self) -> bool:
        return bool(self.AADHAAR_VERIFICATION_API_KEY and len(self.AADHAAR_VERIFICATION_API_KEY) > 5)

    @property
    def has_pan_api(self) -> bool:
        return bool(self.PAN_VERIFICATION_API_KEY and len(self.PAN_VERIFICATION_API_KEY) > 5)

    @property
    def has_passport_api(self) -> bool:
        return bool(self.PASSPORT_VERIFICATION_API_KEY and len(self.PASSPORT_VERIFICATION_API_KEY) > 5)

settings = Settings()
