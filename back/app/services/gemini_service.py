import google.generativeai as genai
from ..core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

def generate_feedback_from_diary(diary_content: str) -> str:
    """
    日記の内容からGemini APIを使ってフィードバックを生成する
    """
    if not diary_content:
        return "日記の内容がありません。"

    # プロンプトの設計が重要です
    prompt = f"""
    あなたは、ユーザーに寄り添う優しいカウンセラーです。
    以下の日記を読んで、書いた人が少しでも前向きな気持ちになれるような、温かいフィードバックを150字以内で作成してください。
    フィードバックは、丁寧な言葉遣いで、友人のように語りかけるスタイルでお願いします。

    # 日記の内容
    {diary_content}
    """

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return "フィードバックの生成中にエラーが発生しました。"

def generate_monthly_feedback_from_diaries(diaries_content: str, year: int, month: int) -> str:
    """
    月の日記を全て読み込んで、月ごとのフィードバックを生成する
    """
    if not diaries_content:
        return f"{year}年{month}月の日記が見つかりませんでした。"

    # プロンプトの設計
    prompt = f"""
    あなたは、ユーザーに寄り添う優しいカウンセラーです。
    以下の{year}年{month}月の日記を全て読んで、その月の全体を通しての振り返りとフィードバックを300字以内で作成してください。
    
    フィードバックは以下の点を含めてください：
    1. その月の全体的な印象やテーマ
    2. 書いた人の心境の変化や成長
    3. 特に印象的な出来事や感情
    4. 来月への前向きなメッセージ
    
    フィードバックは、丁寧な言葉遣いで、友人のように語りかけるスタイルでお願いします。
    「この1ヶ月、お疲れさまでした」のような温かい言葉で始めてください。

    # {year}年{month}月の日記内容
    {diaries_content}
    """

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return f"{year}年{month}月のフィードバックの生成中にエラーが発生しました。"

def analyze_emotion_from_diary(diary_content: str) -> str:
    """
    日記の内容から感情を分析して5段階の評価を返す
    """
    if not diary_content:
        return "normal"

    # プロンプトの設計
    prompt = f"""
    あなたは感情分析の専門家です。
    以下の日記の内容を読んで、書いた人の感情を5段階で評価してください。

    評価基準：
    - very_happy: 非常に幸せ、興奮、達成感、喜びに満ちている
    - happy: 幸せ、満足、楽しい、前向き
    - normal: 普通、平静、特に感情の起伏がない
    - unhappy: 悲しい、不満、落ち込んでいる、心配
    - very_unhappy: 非常に悲しい、絶望的、怒り、深い落ち込み

    回答は必ず以下の5つのうちの1つを選んでください：
    very_happy, happy, normal, unhappy, very_unhappy

    # 日記の内容
    {diary_content}
    """

    try:
        response = model.generate_content(prompt)
        result = response.text.strip().lower()
        
        # 結果を検証して有効な値のみを返す
        valid_emotions = ['very_happy', 'happy', 'normal', 'unhappy', 'very_unhappy']
        if result in valid_emotions:
            return result
        else:
            print(f"Invalid emotion result: {result}, defaulting to normal")
            return "normal"
            
    except Exception as e:
        print(f"Gemini API Error in emotion analysis: {e}")
        return "normal"