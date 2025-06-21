from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime
from typing import List, Optional
from ..models.friend import FriendRequest, Notification, Feedback
from ..models.user import User

def get_friend_request(db: Session, request_id: int):
    """フレンドリクエストをIDで取得"""
    return db.query(FriendRequest).filter(FriendRequest.id == request_id).first()

def get_friend_request_by_users(db: Session, from_user_id: int, to_user_id: int):
    """2人のユーザー間のフレンドリクエストを取得"""
    return db.query(FriendRequest).filter(
        FriendRequest.from_user_id == from_user_id,
        FriendRequest.to_user_id == to_user_id
    ).first()

def get_friend_requests(db: Session, user_id: int, status: Optional[str] = None):
    """ユーザーの受信したフレンドリクエスト一覧を取得"""
    query = db.query(FriendRequest).filter(FriendRequest.to_user_id == user_id)
    if status:
        query = query.filter(FriendRequest.status == status)
    # 関連するユーザー情報も一緒に取得
    requests = query.all()
    
    # 各リクエストに関連するユーザー情報を明示的に読み込む
    for request in requests:
        if not hasattr(request, '_from_user_loaded'):
            request.from_user = db.query(User).filter(User.id == request.from_user_id).first()
            request._from_user_loaded = True
        if not hasattr(request, '_to_user_loaded'):
            request.to_user = db.query(User).filter(User.id == request.to_user_id).first()
            request._to_user_loaded = True
    
    return requests

def get_sent_friend_requests(db: Session, user_id: int, status: Optional[str] = None):
    """ユーザーの送信したフレンドリクエスト一覧を取得"""
    query = db.query(FriendRequest).filter(FriendRequest.from_user_id == user_id)
    if status:
        query = query.filter(FriendRequest.status == status)
    # 関連するユーザー情報も一緒に取得
    requests = query.all()
    
    # 各リクエストに関連するユーザー情報を明示的に読み込む
    for request in requests:
        if not hasattr(request, '_from_user_loaded'):
            request.from_user = db.query(User).filter(User.id == request.from_user_id).first()
            request._from_user_loaded = True
        if not hasattr(request, '_to_user_loaded'):
            request.to_user = db.query(User).filter(User.id == request.to_user_id).first()
            request._to_user_loaded = True
    
    return requests

def create_friend_request(db: Session, from_user_id: int, to_user_id: int):
    """フレンドリクエストを作成"""
    # 自分自身にリクエストは送れない
    if from_user_id == to_user_id:
        return None
    
    # すでにリクエストが存在するか確認
    existing_request = get_friend_request_by_users(db, from_user_id, to_user_id)
    if existing_request:
        # 既存のリクエストがある場合は、そのステータスを返す
        return existing_request
    
    # 相手からのリクエストが存在するか確認
    reverse_request = get_friend_request_by_users(db, to_user_id, from_user_id)
    if reverse_request:
        if reverse_request.status == "pending":
            # 相手からのリクエストがある場合は自動的に承認
            reverse_request.status = "accepted"
            db.commit()
            db.refresh(reverse_request)
            
            # 承認通知を作成
            create_notification(
                db, 
                to_user_id, 
                f"フレンドリクエストが承認されました", 
                "friend", 
                from_user_id
            )
            
            return reverse_request
        else:
            # 既に処理済みのリクエストがある場合は、そのまま返す
            return reverse_request
    
    # 新しいリクエストを作成
    db_request = FriendRequest(
        from_user_id=from_user_id,
        to_user_id=to_user_id,
        status="pending"
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    # 通知を作成
    create_notification(
        db, 
        to_user_id, 
        f"新しいフレンドリクエストが届きました", 
        "friend", 
        from_user_id
    )
    
    return db_request

def update_friend_request(db: Session, request_id: int, status: str):
    """フレンドリクエストのステータスを更新"""
    db_request = get_friend_request(db, request_id)
    if not db_request:
        return None
    
    db_request.status = status
    db.commit()
    db.refresh(db_request)
    
    if status == "accepted":
        # フレンド承認の通知を作成
        create_notification(
            db, 
            db_request.from_user_id, 
            f"フレンドリクエストが承認されました", 
            "friend", 
            db_request.to_user_id
        )
    
    return db_request

def get_friends(db: Session, user_id: int):
    """ユーザーのフレンド一覧を取得"""
    # 承認済みのリクエストを取得
    sent_requests = db.query(FriendRequest).filter(
        FriendRequest.from_user_id == user_id,
        FriendRequest.status == "accepted"
    ).all()
    
    received_requests = db.query(FriendRequest).filter(
        FriendRequest.to_user_id == user_id,
        FriendRequest.status == "accepted"
    ).all()
    
    friend_ids = [req.to_user_id for req in sent_requests] + [req.from_user_id for req in received_requests]
    
    return db.query(User).filter(User.id.in_(friend_ids)).all()

def get_friend_ids(db: Session, user_id: int):
    """ユーザーのフレンドIDリストを取得"""
    friends = get_friends(db, user_id)
    return [friend.id for friend in friends]

def create_notification(db: Session, user_id: int, message: str, type: str, related_id: Optional[int] = None):
    """通知を作成"""
    db_notification = Notification(
        user_id=user_id,
        message=message,
        type=type,
        related_id=related_id
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def get_notifications(db: Session, user_id: int, skip: int = 0, limit: int = 20, unread_only: bool = False):
    """ユーザーの通知一覧を取得"""
    query = db.query(Notification).filter(Notification.user_id == user_id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

def mark_notification_as_read(db: Session, notification_id: int):
    """通知を既読にする"""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        return None
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification

def mark_all_notifications_as_read(db: Session, user_id: int):
    """ユーザーの全通知を既読にする"""
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    return True

def create_feedback(db: Session, user_id: int, period: str, content: str):
    """フィードバックを作成"""
    db_feedback = Feedback(
        user_id=user_id,
        period=period,
        content=content
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    
    # 通知も作成
    create_notification(
        db,
        user_id,
        f"新しい{period}フィードバックが届きました",
        "feedback",
        db_feedback.id
    )
    
    return db_feedback

def get_latest_feedback(db: Session, user_id: int, period: str):
    """最新のフィードバックを取得"""
    return db.query(Feedback).filter(
        Feedback.user_id == user_id,
        Feedback.period == period
    ).order_by(Feedback.created_at.desc()).first()
