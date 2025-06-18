from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...core.security import get_current_user
from ...models.user import User
from ...schemas.user import UserResponse
from ...schemas.friend import (
    FriendRequestResponse, FriendRequestDetail, NotificationResponse, FeedbackResponse
)
from ...schemas.diary import DiaryResponse
from ...crud.friend import (
    get_friend_request, get_friend_requests, get_sent_friend_requests, 
    create_friend_request, update_friend_request, get_friends, 
    get_notifications, mark_notification_as_read, mark_all_notifications_as_read,
    get_latest_feedback, create_feedback
)
from ...crud.diary import get_user_diaries

router = APIRouter(
    prefix="/friend",
    tags=["フレンド"],
    responses={404: {"description": "Not found"}},
)

@router.post("/request/{user_id}", response_model=FriendRequestResponse)
def send_friend_request(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """フレンド申請を送信する"""
    request = create_friend_request(db, current_user.id, user_id)
    if request is None:
        raise HTTPException(status_code=400, detail="フレンドリクエストを作成できませんでした")
    
    return request

@router.post("/accept/{request_id}", response_model=FriendRequestResponse)
def accept_friend_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """フレンド申請を承認する"""
    # リクエストが存在し、自分宛てであることを確認
    request = get_friend_request(db, request_id)
    if not request or request.to_user_id != current_user.id:
        raise HTTPException(status_code=404, detail="フレンドリクエストが見つかりません")
    
    # 既に承認済みか拒否済みの場合はエラー
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="このリクエストは既に処理済みです")
    
    # リクエストを承認
    updated_request = update_friend_request(db, request_id, "accepted")
    if updated_request is None:
        raise HTTPException(status_code=404, detail="フレンドリクエストが見つかりません")
    
    return updated_request

@router.post("/reject/{request_id}", response_model=FriendRequestResponse)
def reject_friend_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """フレンド申請を拒否する"""
    # リクエストが存在し、自分宛てであることを確認
    request = get_friend_request(db, request_id)
    if not request or request.to_user_id != current_user.id:
        raise HTTPException(status_code=404, detail="フレンドリクエストが見つかりません")
    
    # 既に承認済みか拒否済みの場合はエラー
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="このリクエストは既に処理済みです")
    
    # リクエストを拒否
    updated_request = update_friend_request(db, request_id, "rejected")
    if updated_request is None:
        raise HTTPException(status_code=404, detail="フレンドリクエストが見つかりません")
    
    return updated_request

@router.get("/requests", response_model=List[FriendRequestDetail])
def read_friend_requests(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """受信したフレンドリクエスト一覧を取得する"""
    return get_friend_requests(db, current_user.id, status)

@router.get("/requests/sent", response_model=List[FriendRequestDetail])
def read_sent_friend_requests(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """送信したフレンドリクエスト一覧を取得する"""
    return get_sent_friend_requests(db, current_user.id, status)

@router.get("/list", response_model=List[UserResponse])
def read_friends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """フレンド一覧を取得する"""
    return get_friends(db, current_user.id)

@router.get("/{user_id}/diaries", response_model=List[DiaryResponse])
def read_friend_diaries(
    user_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """フレンドの公開日記一覧を取得する"""
    # フレンドリストを取得
    friends = get_friends(db, current_user.id)
    friend_ids = [friend.id for friend in friends]
    
    # 指定されたユーザーがフレンドリストに含まれているか確認
    if user_id not in friend_ids and user_id != current_user.id:
        raise HTTPException(status_code=403, detail="このユーザーの日記を閲覧する権限がありません")
    
    # 自分自身の場合は全ての日記を返す
    if user_id == current_user.id:
        return get_user_diaries(db, user_id, skip, limit)
    
    # フレンドの場合は公開中の日記のみ返す
    diaries = get_user_diaries(db, user_id, skip, limit)
    # 閲覧可能な日記のみフィルタリング
    viewable_diaries = [diary for diary in diaries if diary.is_viewable]
    
    return viewable_diaries

# 通知API
@router.get("/notifications", response_model=List[NotificationResponse])
def read_notifications(
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """通知一覧を取得する"""
    return get_notifications(db, current_user.id, skip, limit, unread_only)

@router.post("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """通知を既読にする"""
    notification = mark_notification_as_read(db, notification_id)
    if notification is None or notification.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="通知が見つかりません")
    
    return notification

@router.post("/notifications/read-all", status_code=204)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """すべての通知を既読にする"""
    mark_all_notifications_as_read(db, current_user.id)

# フィードバックAPI
@router.get("/feedback/{period}", response_model=FeedbackResponse)
def get_feedback(
    period: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """特定の期間のフィードバックを取得する"""
    if period not in ["weekly", "monthly"]:
        raise HTTPException(status_code=400, detail="期間は'weekly'または'monthly'を指定してください")
    
    feedback = get_latest_feedback(db, current_user.id, period)
    if feedback is None:
        raise HTTPException(status_code=404, detail="フィードバックが見つかりません")
    
    return feedback
