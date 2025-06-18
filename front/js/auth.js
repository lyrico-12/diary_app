// 認証関連の処理
const API_BASE_URL = 'http://localhost:8000';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// 認証状態をチェックして画面表示を切り替える
function checkAuth() {
    if (authToken) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        document.getElementById('user-name').textContent = currentUser?.username || '';
        document.getElementById('streak-number').textContent = currentUser?.streak_count || '0';
        loadInitialData();
    } else {
        document.getElementById('main-screen').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');
    }
}

// 認証タブの切り替え
function setupAuthTabs() {
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // タブの切り替え
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // フォームの表示切り替え
            const targetId = tab.getAttribute('data-tab') + '-form';
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// ログイン処理
async function login(username, password) {
    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await fetch(`${API_BASE_URL}/auth/token`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
            },
            // credentials: 'include' を削除
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'ログインに失敗しました');
        }
        
        const data = await response.json();
        authToken = data.access_token;
        localStorage.setItem('authToken', authToken);
        
        // ユーザー情報を取得
        await fetchUserInfo();
        
        // 画面表示を切り替え
        checkAuth();
        
        return true;
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('login-error').textContent = error.message;
        return false;
    }
}

// 新規登録処理
async function register(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            // credentials: 'include' を削除
            body: JSON.stringify({ username, email, password })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || '登録に失敗しました');
        }
        
        // 登録後に自動ログイン
        await login(username, password);
        
        return true;
    } catch (error) {
        console.error('Register error:', error);
        document.getElementById('register-error').textContent = error.message;
        return false;
    }
}

// ユーザー情報を取得
async function fetchUserInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('ユーザー情報の取得に失敗しました');
        }
        
        const userData = await response.json();
        currentUser = userData;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // ユーザー名とストリーク数を表示
        document.getElementById('user-name').textContent = userData.username;
        document.getElementById('streak-number').textContent = userData.streak_count;
        
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

// ログアウト処理
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    checkAuth();
}

// 認証関連のイベントリスナー設定
function setupAuthListeners() {
    // ログインフォーム
    document.getElementById('login-btn').addEventListener('click', async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            document.getElementById('login-error').textContent = 'ユーザー名とパスワードを入力してください';
            return;
        }
        
        await login(username, password);
    });
    
    // 新規登録フォーム
    document.getElementById('register-btn').addEventListener('click', async () => {
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        if (!username || !email || !password) {
            document.getElementById('register-error').textContent = '全ての項目を入力してください';
            return;
        }
        
        if (password.length < 6) {
            document.getElementById('register-error').textContent = 'パスワードは6文字以上にしてください';
            return;
        }
        
        await register(username, email, password);
    });
    
    // ログアウトボタン
    document.getElementById('logout-btn').addEventListener('click', () => {
        logout();
    });
}

// 初期データの読み込み
async function loadInitialData() {
    // ホーム画面のフィードを読み込む
    await loadDiaryFeed();
    
    // 通知数を取得
    await checkNotifications();
    
    // フレンドリクエスト数を取得
    await checkFriendRequests();
}
