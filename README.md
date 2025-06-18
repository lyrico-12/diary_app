# タイムリミット日記アプリ

制限時間と文字数でクリエイティブな日記を書くアプリケーション。
ユーザーは時間制限と文字数制限のもとで日記を書き、一定期間公開することができます。

## コンセプト

- **制限 × ランダム性 × 一時公開**: 時間制限と文字数制限がランダムに設定され、書かれた日記は一定期間だけ公開されます
- SNS要素: 友達の日記を閲覧したり、いいねを送ることができます
- ストリーク機能: 連続投稿日数を記録し、継続的な日記習慣を促進します

## 技術スタック

### バックエンド
- FastAPI
- SQLAlchemy (SQLite/PostgreSQL)
- JWT認証

### フロントエンド
- HTML/CSS/JavaScript (フレームワークなし)

## セットアップ

### 環境構築
1. リポジトリをクローン
```bash
git clone <リポジトリURL>
cd diary_app
```

2. 仮想環境を作成して有効化
```bash
python -m venv .venv
source .venv/bin/activate  # Linuxの場合
# または
.venv\Scripts\activate  # Windowsの場合
```

3. 依存パッケージのインストール
```bash
cd back
pip install -r requirements.txt
```

4. 環境変数の設定
`.env.example` ファイルを参考に、`.env` ファイルを作成してください。

### アプリケーションの実行

1. バックエンドの起動
```bash
cd back
uvicorn app.main:app --reload --host 0.0.0.0
```

2. フロントエンドの起動
```bash
cd front
python -m http.server 8080
```

3. ブラウザでアクセス
http://localhost:8080 にアクセスしてアプリケーションを使用できます。

## 機能

- ユーザー登録・ログイン
- ランダムな制限付きの日記作成
- フレンド機能
- 日記のフィード表示
- いいね機能
- ストリーク（連続投稿）の記録

## API ドキュメント

FastAPIの自動生成されたAPIドキュメントは以下のURLで確認できます：
http://localhost:8000/docs

## 開発者

- あなたの名前

## ライセンス

MIT License
