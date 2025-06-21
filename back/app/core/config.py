import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    """アプリケーション設定"""
    APP_NAME: str = "タイムリミット日記アプリ"
    APP_VERSION: str = "0.1.0"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./diary_app.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-for-jwt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1週間
    
    # 日記の制限設定
    DEFAULT_VIEW_LIMIT_DURATION_SEC: int = 86400  # デフォルトの閲覧可能時間（1日）
    TIME_LIMIT_OPTIONS: list = [180, 300, 420, 600]  # 3分, 5分, 7分, 10分
    CHAR_LIMIT_OPTIONS: list = [100, 200, 500, 0]  # 0は無制限
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")

settings = Settings()
