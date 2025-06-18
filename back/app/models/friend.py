from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base

class FriendRequest(Base):
    __tablename__ = "friend_requests"

    id = Column(Integer, primary_key=True, index=True)
    from_user_id = Column(Integer, ForeignKey("users.id"))
    to_user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String)  # 'pending', 'accepted', 'rejected'
    created_at = Column(DateTime, default=func.now())
    
    # リレーションシップ
    from_user = relationship("User", foreign_keys=[from_user_id], backref="sent_friend_requests")
    to_user = relationship("User", foreign_keys=[to_user_id], backref="received_friend_requests")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    type = Column(String)  # 'like', 'friend', 'streak', 'feedback'
    related_id = Column(Integer, nullable=True)  # 関連するIDを保存（日記ID、ユーザーIDなど）
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    
    # リレーションシップ
    user = relationship("User", backref="notifications")


class Feedback(Base):
    __tablename__ = "feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    period = Column(String)  # 'weekly' or 'monthly'
    content = Column(Text)
    created_at = Column(DateTime, default=func.now())
    
    # リレーションシップ
    user = relationship("User", backref="feedbacks")
