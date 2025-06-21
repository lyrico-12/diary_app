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