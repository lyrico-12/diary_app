from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
from typing import List, Optional
from ..models.diary import Diary, DiaryLike
from ..models.user import User
from ..schemas.diary import DiaryCreate
from .user import update_streak

def get_diary(db: Session, diary_id: int):
    """日記IDで日記を取得する"""
    return db.query(Diary).filter(Diary.id == diary_id).first()

def get_diary_by_user(db: Session, user_id: int, diary_id: int):
    """特定のユーザーの特定の日記を取得する"""
    return db.query(Diary).filter(Diary.user_id == user_id, Diary.id == diary_id).first()

def get_user_diaries(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """ユーザーの全日記を取得する（自分用）"""
    return db.query(Diary).filter(Diary.user_id == user_id).order_by(
        Diary.created_at.desc()
    ).offset(skip).limit(limit).all()

def get_public_diaries(db: Session, skip: int = 0, limit: int = 20):
    """公開中の日記一覧を取得する（閲覧期限内のもの）"""
    now = datetime.now()
    return db.query(Diary).filter(
        # SQLiteでは単純な日時計算を使用
        Diary.is_viewable == True
    ).order_by(Diary.created_at.desc()).offset(skip).limit(limit).all()

def get_friend_diaries(db: Session, user_id: int, friend_ids: List[int], skip: int = 0, limit: int = 20):
    """フレンドの公開中の日記一覧を取得する"""
    now = datetime.now()
    # SQLiteでの日時計算の対応
    # 直接timedelta（秒数）を使って比較
    return db.query(Diary).filter(
        Diary.user_id.in_(friend_ids),
        # SQLiteでは単純な日時計算を使用
        Diary.is_viewable == True
    ).order_by(Diary.created_at.desc()).offset(skip).limit(limit).all()

def get_specific_friend_diaries(db: Session, friend_id: int, skip: int = 0, limit: int = 20):
    """特定のフレンドの公開中の日記一覧を取得する"""
    return db.query(Diary).filter(
        Diary.user_id == friend_id,
        Diary.is_viewable == True
    ).order_by(Diary.created_at.desc()).offset(skip).limit(limit).all()

def create_diary(db: Session, diary: DiaryCreate, user_id: int):
    """新しい日記を作成する"""
    db_diary = Diary(
        user_id=user_id,
        title=diary.title,
        content=diary.content,
        time_limit_sec=diary.time_limit_sec,
        char_limit=diary.char_limit,
        view_limit_duration_sec=diary.view_limit_duration_sec
    )
    db.add(db_diary)
    db.commit()
    db.refresh(db_diary)
    
    # ストリークを更新する
    update_streak(db, user_id)
    
    return db_diary

def increment_view_count(db: Session, diary_id: int):
    """日記の閲覧回数をインクリメントする"""
    diary = get_diary(db, diary_id)
    if not diary:
        return None
    
    diary.view_count += 1
    db.commit()
    db.refresh(diary)
    return diary

def like_diary(db: Session, diary_id: int, user_id: int):
    """日記にいいねを付ける"""
    # すでにいいね済みかチェック
    existing_like = db.query(DiaryLike).filter(
        DiaryLike.diary_id == diary_id,
        DiaryLike.user_id == user_id
    ).first()
    
    if existing_like:
        return None
    
    # 日記が存在するかチェック
    diary = get_diary(db, diary_id)
    if not diary:
        return None
    
    # いいねを作成
    db_like = DiaryLike(diary_id=diary_id, user_id=user_id)
    db.add(db_like)
    
    # いいね数をインクリメント
    diary.like_count += 1
    
    db.commit()
    db.refresh(db_like)
    return db_like

def unlike_diary(db: Session, diary_id: int, user_id: int):
    """日記のいいねを取り消す"""
    like = db.query(DiaryLike).filter(
        DiaryLike.diary_id == diary_id,
        DiaryLike.user_id == user_id
    ).first()
    
    if not like:
        return False
    
    diary = get_diary(db, diary_id)
    if not diary:
        return False
    
    db.delete(like)
    
    # いいね数をデクリメント
    if diary.like_count > 0:
        diary.like_count -= 1
    
    db.commit()
    return True
