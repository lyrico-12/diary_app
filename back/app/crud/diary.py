from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
from typing import List, Optional
from ..models.diary import Diary, DiaryLike, Feedback
from ..models.user import User
from ..schemas.diary import DiaryCreate
from .user import update_streak
from ..services.gemini_service import analyze_emotion_from_diary

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
    print(f"get_friend_diaries - ユーザーID: {user_id}, フレンドID: {friend_ids}")
    
    if not friend_ids:
        print("フレンドIDが空のため、空のリストを返します")
        return []
    
    now = datetime.now()
    print(f"現在時刻: {now}")
    
    # 全フレンドの日記を取得（is_viewableフィルタなし）、ユーザー情報も一緒に取得
    all_friend_diaries = db.query(Diary).options(joinedload(Diary.user)).filter(
        Diary.user_id.in_(friend_ids)
    ).order_by(Diary.created_at.desc()).all()
    
    print(f"フレンドの全日記数: {len(all_friend_diaries)}")
    
    # is_viewableでフィルタリング
    viewable_diaries = []
    for diary in all_friend_diaries:
        is_viewable = diary.is_viewable
        print(f"日記ID: {diary.id}, ユーザーID: {diary.user_id}, is_viewable: {is_viewable}, created_at: {diary.created_at}, view_limit_duration: {diary.view_limit_duration_sec}")
        if is_viewable:
            # ユーザー情報が読み込まれているか確認
            if diary.user:
                print(f"日記詳細 - ID: {diary.id}, ユーザー: {diary.user.username}, タイトル: {diary.title}, is_viewable: {is_viewable}")
            else:
                print(f"警告: 日記ID {diary.id} のユーザー情報が取得できませんでした")
            viewable_diaries.append(diary)
    
    print(f"閲覧可能な日記数: {len(viewable_diaries)}")
    
    # ページネーション
    result = viewable_diaries[skip:skip + limit]
    print(f"ページネーション後: {len(result)}件")
    
    return result

def get_specific_friend_diaries(db: Session, friend_id: int, skip: int = 0, limit: int = 20):
    """特定のフレンドの公開中の日記一覧を取得する"""
    print(f"get_specific_friend_diaries - フレンドID: {friend_id}")
    
    # 全日記を取得（is_viewableフィルタなし）、ユーザー情報も一緒に取得
    all_diaries = db.query(Diary).options(joinedload(Diary.user)).filter(
        Diary.user_id == friend_id
    ).order_by(Diary.created_at.desc()).all()
    
    print(f"フレンドの全日記数: {len(all_diaries)}")
    
    # is_viewableでフィルタリング
    viewable_diaries = []
    for diary in all_diaries:
        is_viewable = diary.is_viewable
        print(f"日記ID: {diary.id}, is_viewable: {is_viewable}, created_at: {diary.created_at}, view_limit_duration: {diary.view_limit_duration_sec}")
        if is_viewable:
            # ユーザー情報が読み込まれているか確認
            if diary.user:
                print(f"日記詳細 - ID: {diary.id}, ユーザー: {diary.user.username}, タイトル: {diary.title}, is_viewable: {is_viewable}")
            else:
                print(f"警告: 日記ID {diary.id} のユーザー情報が取得できませんでした")
            viewable_diaries.append(diary)
    
    print(f"閲覧可能な日記数: {len(viewable_diaries)}")
    
    # ページネーション
    result = viewable_diaries[skip:skip + limit]
    print(f"ページネーション後: {len(result)}件")
    
    return result

def create_diary(db: Session, diary: DiaryCreate, user_id: int):
    """新しい日記を作成する"""
    # 感情分析を実行
    emotion_result = analyze_emotion_from_diary(diary.content)
    
    db_diary = Diary(
        user_id=user_id,
        title=diary.title,
        content=diary.content,
        time_limit_sec=diary.time_limit_sec,
        char_limit=diary.char_limit,
        view_limit_duration_sec=diary.view_limit_duration_sec,
        emotion_analysis=emotion_result
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

def delete_diary(db: Session, diary_id: int, user_id: int):
    """日記を削除する（自分の日記のみ）"""
    diary = get_diary_by_user(db, user_id, diary_id)
    if not diary:
        return False
    
    # 関連するフィードバックも削除
    db.query(Feedback).filter(Feedback.diary_id == diary_id).delete()
    
    # 関連するいいねも削除
    db.query(DiaryLike).filter(DiaryLike.diary_id == diary_id).delete()
    
    # 日記を削除
    db.delete(diary)
    db.commit()
    return True

def get_user_diaries_by_period(db: Session, user_id: int, start_date: datetime, end_date: datetime):
    """指定された期間のユーザーの日記を取得する"""
    return db.query(Diary).filter(
        Diary.user_id == user_id,
        Diary.created_at >= start_date,
        Diary.created_at < end_date
    ).order_by(Diary.created_at.asc()).all()

def check_user_liked_diary(db: Session, diary_id: int, user_id: int):
    """ユーザーが特定の日記にいいねしているかどうかを確認する"""
    like = db.query(DiaryLike).filter(
        DiaryLike.diary_id == diary_id,
        DiaryLike.user_id == user_id
    ).first()
    return like is not None
