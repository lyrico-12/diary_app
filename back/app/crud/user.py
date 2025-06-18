from sqlalchemy.orm import Session
from ..models.user import User
from ..schemas.user import UserCreate
from ..core.security import get_password_hash, verify_password
from typing import Optional
from datetime import datetime, date

def get_user(db: Session, user_id: int):
    """ユーザーIDでユーザーを取得する"""
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    """ユーザー名でユーザーを取得する"""
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    """メールアドレスでユーザーを取得する"""
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """ユーザー一覧を取得する"""
    return db.query(User).offset(skip).limit(limit).all()

def create_user(db: Session, user: UserCreate):
    """新しいユーザーを作成する"""
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str):
    """ユーザー認証を行う"""
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def update_streak(db: Session, user_id: int, today: Optional[date] = None):
    """ユーザーのストリークを更新する"""
    if today is None:
        today = date.today()
    
    user = get_user(db, user_id)
    if not user:
        return None
    
    # 最後のストリーク日がない場合は初めての投稿
    if user.last_streak_date is None:
        user.streak_count = 1
        user.last_streak_date = today
    else:
        # 前回の投稿日を日付だけに変換
        last_date = user.last_streak_date.date()
        
        # 今日すでに投稿している場合は変更なし
        if last_date == today:
            pass
        # 昨日投稿していた場合はストリーク+1
        elif (today - last_date).days == 1:
            user.streak_count += 1
            user.last_streak_date = today
        # 2日以上空いていた場合はストリークリセット
        elif (today - last_date).days > 1:
            user.streak_count = 1
            user.last_streak_date = today
    
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, db_user: User, user_update):
    """ユーザー情報を更新する"""
    # 更新が必要なフィールドのみ処理
    if user_update.username is not None:
        db_user.username = user_update.username
    if user_update.email is not None:
        db_user.email = user_update.email
    if user_update.password is not None:
        db_user.hashed_password = get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    """ユーザーを削除する"""
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user
