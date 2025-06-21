from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base
from datetime import datetime, timedelta, timezone


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
        # 日本時間で統一して比較
        jst = timezone(timedelta(hours=9))
        now_jst = datetime.now(jst)
        created_jst = self.created_at
        
        # created_atがタイムゾーン情報を持っていない場合は、日本時間として扱う
        if created_jst.tzinfo is None:
            created_jst = created_jst.replace(tzinfo=jst)
        else:
            # タイムゾーン情報がある場合は、日本時間に変換
            created_jst = created_jst.astimezone(jst)
        
        view_end_time = created_jst + timedelta(seconds=self.view_limit_duration_sec)
        is_viewable = now_jst <= view_end_time
        
        print(f"is_viewable計算 (JST): 日記ID={self.id}, 現在時刻JST={now_jst}, 作成時刻JST={created_jst}, 終了時刻JST={view_end_time}, 結果={is_viewable}")
        
        return is_viewable


class DiaryLike(Base):
    __tablename__ = "diary_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    diary_id = Column(Integer, ForeignKey("diaries.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    
    # リレーションシップ
    diary = relationship("Diary", backref="likes")
    user = relationship("User", backref="diary_likes")
