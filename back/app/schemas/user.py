from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    streak_count: int
    profile_image_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserDetail(UserResponse):
    last_streak_date: Optional[datetime] = None
    profile_image_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    
    class Config:
        from_attributes = True

class ProfileImageUpdate(BaseModel):
    profile_image_url: str = Field(..., description="Base64エンコードされた画像データまたは画像URL")
    
    class Config:
        from_attributes = True
