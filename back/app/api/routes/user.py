from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from ...core.database import get_db
from ...core.security import get_current_user
from ...schemas.user import UserResponse, UserUpdate
from ...crud.user import get_user, update_user, delete_user, search_users
from ...models.user import User

router = APIRouter(
    prefix="/users",
    tags=["ユーザー"],
    responses={404: {"description": "Not found"}},
)

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """現在のログインユーザーの情報を取得"""
    return current_user

@router.get("/search", response_model=List[UserResponse])
def search_users_endpoint(
    query: str = Query(..., min_length=1, max_length=50, description="検索クエリ"),
    skip: int = Query(0, ge=0, description="スキップする件数"),
    limit: int = Query(20, ge=1, le=100, description="取得する件数"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ユーザー名でユーザーを検索する"""
    users = search_users(db, query, current_user.id, skip, limit)
    return users

@router.put("/me", response_model=UserResponse)
def update_user_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ユーザー情報の更新"""
    updated_user = update_user(db, db_user=current_user, user_update=user_update)
    return updated_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ユーザーアカウントの削除"""
    delete_user(db, user_id=current_user.id)
    return {"detail": "User deleted successfully"}

@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """特定のユーザー情報を取得"""
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user