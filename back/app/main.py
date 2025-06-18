from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import Base, engine
from .api.routes import auth_router, diary_router, friend_router, user_router

# データベーステーブルの作成
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="タイムリミット日記アプリ",
    description="制限時間と文字数でクリエイティブな日記を書くアプリのAPI",
    version="0.1.0"
)

# CORSの設定
# 開発環境では特定のオリジンを許可
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://[::]:8080",
    "http://[::1]:8080"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex="http://.*",  # 任意のHTTPオリジンを許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# ヘルスチェック用エンドポイント
@app.get("/")
async def root():
    return {"message": "タイムリミット日記アプリAPI"}

# APIルーターの登録
app.include_router(auth_router)
app.include_router(diary_router)
app.include_router(friend_router)
