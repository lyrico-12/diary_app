from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...core.security import get_current_user
from ...models.user import User
from ...schemas.diary import DiaryCreate, DiaryResponse, DiaryDetail, DiaryRules, DiaryLikeResponse
from ...crud.diary import (
    get_diary, get_diary_by_user, get_user_diaries, get_public_diaries,
    get_friend_diaries, get_specific_friend_diaries, create_diary, increment_view_count, like_diary, unlike_diary
)
from ...crud.friend import get_friend_ids, create_notification, are_friends
from ...utils.diary_rules import generate_random_rules
from app.services.gemini_service import generate_feedback_from_diary
from app.crud import diary as crud_diary
from app.models.diary import Feedback

router = APIRouter(
    prefix="/diary",
    tags=["日記"],
    responses={404: {"description": "Not found"}},
)

@router.post("", response_model=DiaryResponse)
def create_new_diary(
    diary: DiaryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """新しい日記を投稿する"""
    return create_diary(db=db, diary=diary, user_id=current_user.id)

@router.get("/random_rules", response_model=DiaryRules)
def get_random_rules(current_user: User = Depends(get_current_user)):
    """次の投稿時のランダム制限ルールを取得する"""
    return generate_random_rules()

@router.get("/my", response_model=List[DiaryResponse])
def read_own_diaries(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """自分の全日記一覧を取得する"""
    diaries = get_user_diaries(db, user_id=current_user.id, skip=skip, limit=limit)
    return diaries

@router.get("/public", response_model=List[DiaryResponse])
def read_public_diaries(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """公開中の日記一覧を取得する（閲覧可能時間内のもの）"""
    diaries = get_public_diaries(db, skip=skip, limit=limit)
    return diaries

@router.get("/feed", response_model=List[DiaryResponse])
def read_friend_diaries(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """フレンドの公開中の日記一覧を取得する（閲覧可能時間内のもの）"""
    print(f"=== フレンド日記取得開始 ===")
    print(f"ユーザーID: {current_user.id}, ユーザー名: {current_user.username}")
    
    friend_ids = get_friend_ids(db, current_user.id)
    print(f"フレンドID一覧: {friend_ids}")
    
    diaries = get_friend_diaries(db, current_user.id, friend_ids, skip=skip, limit=limit)
    print(f"取得した日記数: {len(diaries)}")
    
    # 各日記の詳細情報をログ出力
    for diary in diaries:
        print(f"日記詳細 - ID: {diary.id}, ユーザー: {diary.user.username if diary.user else 'Unknown'}, タイトル: {diary.title}, is_viewable: {diary.is_viewable}, プロフィール画像: {diary.user.profile_image_url}")
    
    print(f"=== フレンド日記取得完了 ===")
    print(f"diaries: {diaries}")
    return diaries

@router.get("/friend/{friend_id}", response_model=List[DiaryResponse])
def read_specific_friend_diaries(
    friend_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """特定のフレンドの公開中の日記一覧を取得する（閲覧可能時間内のもの）"""
    print(f"=== 特定フレンド日記取得開始 ===")
    print(f"ユーザーID: {current_user.id}, ユーザー名: {current_user.username}")
    print(f"対象フレンドID: {friend_id}")
    
    # フレンド関係をチェック
    are_friends_result = are_friends(db, current_user.id, friend_id)
    print(f"フレンド関係チェック結果: {are_friends_result}")
    
    if not are_friends_result:
        raise HTTPException(status_code=403, detail="このユーザーの日記を閲覧する権限がありません")
    
    diaries = get_specific_friend_diaries(db, friend_id, skip=skip, limit=limit)
    print(f"取得した日記数: {len(diaries)}")
    
    # 各日記の詳細情報をログ出力
    for diary in diaries:
        print(f"日記詳細 - ID: {diary.id}, ユーザー: {diary.user.username if diary.user else 'Unknown'}, タイトル: {diary.title}, is_viewable: {diary.is_viewable}")
    
    print(f"=== 特定フレンド日記取得完了 ===")
    return diaries

@router.get("/{diary_id}", response_model=DiaryDetail)
def read_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """特定の日記を取得する（閲覧可能時間のチェック付き）"""
    diary = get_diary(db, diary_id=diary_id)
    if diary is None:
        raise HTTPException(status_code=404, detail="日記が見つかりません")
    
    # 自分の日記なら無条件で閲覧可能
    if diary.user_id == current_user.id:
        return diary
    
    # 他人の日記は閲覧可能時間内のみ閲覧可能
    if not diary.is_viewable:
        raise HTTPException(status_code=403, detail="この日記はもう閲覧できません")
    
    # 閲覧カウントを増やす（自分の日記でない場合のみ）
    increment_view_count(db, diary_id)
    
    return diary

@router.post("/{diary_id}/view", response_model=DiaryResponse)
def view_diary(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """日記の閲覧記録を残す（閲覧カウントを増やす）"""
    diary = get_diary(db, diary_id=diary_id)
    if diary is None:
        raise HTTPException(status_code=404, detail="日記が見つかりません")
    
    # 自分の日記ではない場合のみカウントを増やす
    if diary.user_id != current_user.id:
        diary = increment_view_count(db, diary_id)
        if diary is None:
            raise HTTPException(status_code=404, detail="日記が見つかりません")
    
    return diary

@router.post("/{diary_id}/like", response_model=DiaryLikeResponse)
def like_diary_endpoint(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """日記にいいねを付ける"""
    diary = get_diary(db, diary_id=diary_id)
    if diary is None:
        raise HTTPException(status_code=404, detail="日記が見つかりません")
    
    like = like_diary(db, diary_id, current_user.id)
    if like is None:
        raise HTTPException(status_code=400, detail="すでにいいね済みか、日記が存在しません")
    
    # いいね通知を作成（自分の日記でない場合のみ）
    if diary.user_id != current_user.id:
        create_notification(
            db,
            diary.user_id,
            "あなたの日記にいいねがつきました",
            "like",
            diary_id
        )
    
    return like

@router.delete("/{diary_id}/like", status_code=204)
def unlike_diary_endpoint(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """日記のいいねを取り消す"""
    result = unlike_diary(db, diary_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="いいねが見つかりません")

@router.post("/{diary_id}/feedback", summary="日記のフィードバックを生成")
async def create_diary_feedback(
    diary_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    日記の内容を元にGemini APIでフィードバックを生成し、DBに保存する。
    API呼び出しに時間がかかる可能性があるため、バックグラウンドタスクとして実行する。
    """
    db_diary = crud_diary.get_diary_by_user(db, user_id=current_user.id, diary_id=diary_id)
    if not db_diary:
        raise HTTPException(status_code=404, detail="日記が見つかりません")

    # 既存のフィードバックがあればそれを返す
    existing_feedback = db.query(Feedback).filter(Feedback.diary_id == diary_id).first()
    if existing_feedback:
        return {"message": "フィードバックは既に存在します。"}

    def task():
        feedback_content = generate_feedback_from_diary(db_diary.content)
        db_feedback = Feedback(
            diary_id=diary_id,
            user_id=current_user.id,
            content=feedback_content
        )
        db.add(db_feedback)
        db.commit()

    background_tasks.add_task(task)
    
    return {"message": "フィードバックの生成を開始しました。少し時間をおいてから再度確認してください。"}

@router.get("/{diary_id}/feedback", summary="日記のフィードバックを取得")
def get_diary_feedback(
    diary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    feedback = db.query(Feedback).filter(
        Feedback.diary_id == diary_id,
        Feedback.user_id == current_user.id
    ).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="フィードバックが見つかりません")
    return feedback
