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
        setupProfileListeners();
        
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
    
    // プロフィールリンク
    document.getElementById('nav-profile').addEventListener('click', () => {
        switchContent('profile');
        initializeProfileScreen();
    });
    
    // カレンダーアイコンボタン
    document.getElementById('calendar-btn').addEventListener('click', () => {
        console.log('カレンダーアイコンがクリックされました');
        console.log('my-diaries-content要素の存在確認:', document.getElementById('my-diaries-content'));
        switchContent('my-diaries');
        console.log('switchContent実行後');
        loadMyDiaries();
        console.log('loadMyDiaries実行後');
    });
}

// コンテンツエリアの切り替え
function switchContent(contentId) {
    console.log('switchContent呼び出し:', contentId);
    
    // ナビゲーションリンクのアクティブ状態を切り替え
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // 対応するナビゲーションリンクが存在する場合のみアクティブにする
    const navElement = document.getElementById(`nav-${contentId}`);
    if (navElement) {
        navElement.classList.add('active');
    }
    
    // コンテンツエリアの表示を切り替え
    document.querySelectorAll('.content').forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('active');
    });
    
    const targetContent = document.getElementById(`${contentId}-content`);
    console.log('ターゲットコンテンツ要素:', targetContent);
    
    if (targetContent) {
        targetContent.classList.remove('hidden');
        targetContent.classList.add('active');
        console.log('コンテンツ切り替え完了');
    } else {
        console.error('ターゲットコンテンツが見つかりません:', `${contentId}-content`);
    }
}
