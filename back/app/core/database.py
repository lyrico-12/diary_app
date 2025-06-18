from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# 開発環境ではSQLite、本番環境ではPostgreSQLを使用
DATABASE_URL = os.getenv(
    "DATABASE_URL", "sqlite:///./diary_app.db"
)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 依存性注入用のDBセッション
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
