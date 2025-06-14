from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="タイムリミット日記アプリ",
    description="制限時間と文字数でクリエイティブな日記を書くアプリのAPI",
    version="0.1.0"
)

# CORSの設定
origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ヘルスチェック用エンドポイント
@app.get("/")
async def root():
    return {"message": "タイムリミット日記アプリAPI"}

# APIルーターのインポートと登録は後で追加
# from app.api.routes import diary, auth, friend
# app.include_router(auth.router)
# app.include_router(diary.router)
# app.include_router(friend.router)
