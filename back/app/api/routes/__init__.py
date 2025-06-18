from .auth import router as auth_router
from .diary import router as diary_router
from .friend import router as friend_router
from .user import router as user_router

__all__ = ["auth_router", "diary_router", "friend_router", "user_router"]