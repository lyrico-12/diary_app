import random
from ..core.config import settings

def generate_random_rules():
    """ランダムな日記作成ルール（制限時間と文字数）を生成する"""
    
    # 制限時間のオプション（秒）
    time_options = settings.TIME_LIMIT_OPTIONS
    
    # 文字数のオプション
    char_options = settings.CHAR_LIMIT_OPTIONS
    
    # ランダムに選択
    time_limit = random.choice(time_options)
    char_limit = random.choice(char_options)
    
    return {
        "time_limit_sec": time_limit,
        "char_limit": char_limit,
        "view_limit_duration_sec": settings.DEFAULT_VIEW_LIMIT_DURATION_SEC
    }
