from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base
from datetime import datetime, timezone, timedelta

class Diary(Base):
    __tablename__ = "diaries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=True)
    content = Column(Text)
    time_limit_sec = Column(Integer)  # 書く時の制限時間
    char_limit = Column(Integer)      # 書く時の文字数制限
    view_limit_duration_sec = Column(Integer)  # 公開後の閲覧可能時間
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    
    # リレーションシップ
    user = relationship("User", backref="diaries")
    
    # 公開終了時間を計算するプロパティ
    @property
    def view_end_time(self):
        return self.created_at + timedelta(seconds=self.view_limit_duration_sec)
    
    # 現在公開中かどうかを判定するプロパティ
    @property
    def is_viewable(self):
        # UTCで比較
        now_utc = datetime.now(timezone.utc)
        created_utc = self.created_at
        if created_utc.tzinfo is None:
            created_utc = created_utc.replace(tzinfo=timezone.utc)
        view_end_time = created_utc + timedelta(seconds=self.view_limit_duration_sec)
        return now_utc <= view_end_time


class DiaryLike(Base):
    __tablename__ = "diary_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    diary_id = Column(Integer, ForeignKey("diaries.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    
    # リレーションシップ
    diary = relationship("Diary", backref="likes")
    user = relationship("User", backref="diary_likes")


# このFeedbackモデルが正しく存在することを確認
class Feedback(Base):
    __tablename__ = "feedbacks"
    id = Column(Integer, primary_key=True, index=True)
    diary_id = Column(Integer, ForeignKey("diaries.id"), unique=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())

