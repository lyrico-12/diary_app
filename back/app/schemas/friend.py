from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from ..schemas.user import UserResponse

class FriendRequestCreate(BaseModel):
    to_user_id: int

class FriendRequestResponse(BaseModel):
    id: int
    from_user_id: int
    to_user_id: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class FriendRequestDetail(FriendRequestResponse):
    from_user: Optional[UserResponse] = None
    to_user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    message: str
    type: str
    related_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class FeedbackBase(BaseModel):
    period: str  # 'weekly' or 'monthly'
    content: str

class FeedbackCreate(FeedbackBase):
    user_id: int

class FeedbackResponse(FeedbackBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
