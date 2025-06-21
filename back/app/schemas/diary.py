from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class UserInfo(BaseModel):
    id: int
    username: str
    
    class Config:
        from_attributes = True

class DiaryBase(BaseModel):
    title: Optional[str] = None
    content: str

class DiaryCreate(DiaryBase):
    time_limit_sec: int
    char_limit: int
    view_limit_duration_sec: int = 600  # デフォルト10分

class DiaryResponse(DiaryBase):
    id: int
    user_id: int
    user: Optional[UserInfo] = None
    view_count: int
    like_count: int
    time_limit_sec: int
    char_limit: int
    created_at: datetime
    is_viewable: bool
    
    class Config:
        from_attributes = True

class DiaryDetail(DiaryResponse):
    # 追加のフィールドがあれば追加
    pass
    
    class Config:
        from_attributes = True

class DiaryRules(BaseModel):
    time_limit_sec: int
    char_limit: int
    view_limit_duration_sec: int = 600  # デフォルト10分

class DiaryLikeCreate(BaseModel):
    diary_id: int

class DiaryLikeResponse(BaseModel):
    id: int
    diary_id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
