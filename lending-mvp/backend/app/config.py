from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    DATABASE_NAME: str
    JWT_SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

settings = Settings()
