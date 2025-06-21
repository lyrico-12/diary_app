// メインアプリケーション

// ページロード時の初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== アプリケーション初期化開始 ===');
    
    try {
        // 認証タブの設定
        console.log('認証タブ設定中...');
        setupAuthTabs();
        
        // 認証状態をチェック
        console.log('認証状態チェック中...');
        checkAuth();
        
        // 各種イベントリスナーの設定
        console.log('イベントリスナー設定中...');
        setupAuthListeners();
        setupNavListeners();
        setupDiaryListeners();
        setupFriendListeners();
        setupNotificationListeners();
        
        console.log('=== アプリケーション初期化完了 ===');
    } catch (error) {
        console.error('アプリケーション初期化エラー:', error);
    }
});

// ナビゲーションリンクのイベントリスナー
function setupNavListeners() {
    // ホームリンク
    document.getElementById('nav-home').addEventListener('click', () => {
        switchContent('home');
        loadDiaryFeed();
    });
    
    // 自分の日記リンク
    document.getElementById('nav-my-diaries').addEventListener('click', () => {
        switchContent('my-diaries');
        loadMyDiaries();
    });
    
    // フレンドリンク
    document.getElementById('nav-friends').addEventListener('click', () => {
        switchContent('friends');
        loadFriends();
        loadFriendRequests();
    });
    
    // 通知リンク
    document.getElementById('nav-notifications').addEventListener('click', () => {
        switchContent('notifications');
        loadNotifications();
    });
    
    // カレンダーアイコンボタン
    document.getElementById('calendar-btn').addEventListener('click', () => {
        switchContent('my-diaries');
        loadMyDiaries();
    });
}

// コンテンツエリアの切り替え
function switchContent(contentId) {
    // ナビゲーションリンクのアクティブ状態を切り替え
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.getElementById(`nav-${contentId}`).classList.add('active');
    
    // コンテンツエリアの表示を切り替え
    document.querySelectorAll('.content').forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('active');
    });
    document.getElementById(`${contentId}-content`).classList.remove('hidden');
    document.getElementById(`${contentId}-content`).classList.add('active');
}
