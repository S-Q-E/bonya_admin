from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str = "change-me"
    jwt_alg: str = "HS256"
    jwt_expire_min: int = 60 * 24 * 7

    ig_access_token: str = ""
    ig_business_id: str = ""
    ig_api_version: str = "v25.0"

    cors_origins: str = "*"
    admin_email: str = "admin@bonya.local"
    admin_password: str = "changeme"

    class Config:
        env_file = ".env"


settings = Settings()