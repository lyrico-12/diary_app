// フレンド関連の処理

// フレンド一覧の読み込み
async function loadFriends() {
    try {
        const response = await fetch(`${API_BASE_URL}/friend/list`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('フレンド一覧の取得に失敗しました');
        }
        
        const friends = await response.json();
        
        const friendsListContainer = document.getElementById('friends-list');
        
        // 空の状態メッセージをクリア
        friendsListContainer.innerHTML = '';
        
        if (friends.length === 0) {
            friendsListContainer.innerHTML = '<p class="empty-state">まだフレンドがいません。<br>検索してフレンドを探してみましょう！</p>';
            return;
        }
        
        // フレンドカードを作成
        friends.forEach(friend => {
            const card = createFriendCard(friend);
            friendsListContainer.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

// フレンドカードの作成
function createFriendCard(friend) {
    const card = document.createElement('div');
    card.className = 'friend-card';
    card.setAttribute('data-id', friend.id);
    
    card.innerHTML = `
        <div class="friend-info">
            <div class="friend-name">${friend.username}</div>
            <div class="friend-streak"><i class="fas fa-fire"></i> ${friend.streak_count || 0} 日連続</div>
        </div>
        <div class="friend-actions">
            <button class="btn small-btn view-diaries-btn">日記を見る</button>
        </div>
    `;
    
    // 日記を見るボタンのクリックイベント
    card.querySelector('.view-diaries-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        viewFriendDiaries(friend.id);
    });
    
    return card;
}

// フレンドの日記一覧を表示
async function viewFriendDiaries(friendId) {
    try {
        const response = await fetch(`${API_BASE_URL}/friend/${friendId}/diaries`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('フレンドの日記取得に失敗しました');
        }
        
        const diaries = await response.json();
        
        // ダイアログでフレンドの日記一覧を表示（モーダルウィンドウ実装は省略）
        alert(`フレンドの日記 ${diaries.length} 件を表示します（実際の表示は実装中）`);
        
    } catch (error) {
        console.error('Error viewing friend diaries:', error);
    }
}

// フレンドリクエストの読み込み
async function loadFriendRequests() {
    try {
        const response = await fetch(`${API_BASE_URL}/friend/requests?status=pending`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('フレンドリクエストの取得に失敗しました');
        }
        
        const requests = await response.json();
        
        const requestsListContainer = document.getElementById('friend-requests-list');
        
        // 空の状態メッセージをクリア
        requestsListContainer.innerHTML = '';
        
        if (requests.length === 0) {
            requestsListContainer.innerHTML = '<p class="empty-state">フレンドリクエストはありません。</p>';
            // リクエストバッジを非表示
            document.getElementById('request-badge').classList.add('hidden');
            return;
        }
        
        // リクエストバッジを表示
        const badge = document.getElementById('request-badge');
        badge.textContent = requests.length;
        badge.classList.remove('hidden');
        
        // リクエストアイテムを作成
        requests.forEach(request => {
            const item = createRequestItem(request);
            requestsListContainer.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error loading friend requests:', error);
    }
}

// フレンドリクエストアイテムの作成
function createRequestItem(request) {
    const item = document.createElement('div');
    item.className = 'request-item';
    item.setAttribute('data-id', request.id);
    
    item.innerHTML = `
        <div class="request-info">
            <div class="request-name">${request.from_user?.username || 'ユーザー'}</div>
            <div class="request-date">${formatDate(request.created_at)}</div>
        </div>
        <div class="request-actions">
            <button class="btn small-btn accept-btn">承認</button>
            <button class="btn small-btn reject-btn">拒否</button>
        </div>
    `;
    
    // 承認ボタンのクリックイベント
    item.querySelector('.accept-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        acceptFriendRequest(request.id);
    });
    
    // 拒否ボタンのクリックイベント
    item.querySelector('.reject-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        rejectFriendRequest(request.id);
    });
    
    return item;
}

// フレンドリクエストを承認
async function acceptFriendRequest(requestId) {
    try {
        const response = await fetch(`${API_BASE_URL}/friend/accept/${requestId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('フレンドリクエストの承認に失敗しました');
        }
        
        // リクエスト一覧を更新
        await loadFriendRequests();
        
        // フレンド一覧も更新
        await loadFriends();
        
    } catch (error) {
        console.error('Error accepting friend request:', error);
    }
}

// フレンドリクエストを拒否
async function rejectFriendRequest(requestId) {
    try {
        const response = await fetch(`${API_BASE_URL}/friend/reject/${requestId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('フレンドリクエストの拒否に失敗しました');
        }
        
        // リクエスト一覧を更新
        await loadFriendRequests();
        
    } catch (error) {
        console.error('Error rejecting friend request:', error);
    }
}

// フレンドリクエストを送信
async function sendFriendRequest(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/friend/request/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('フレンドリクエストの送信に失敗しました');
        }
        
        alert('フレンドリクエストを送信しました');
        
    } catch (error) {
        console.error('Error sending friend request:', error);
        alert('フレンドリクエストの送信に失敗しました: ' + error.message);
    }
}

// ユーザーを検索
async function searchUsers(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('ユーザー検索に失敗しました');
        }
        
        const users = await response.json();
        
        const friendsListContainer = document.getElementById('friends-list');
        
        // 検索結果をクリア
        friendsListContainer.innerHTML = '';
        
        if (users.length === 0) {
            friendsListContainer.innerHTML = '<p class="empty-state">該当するユーザーが見つかりませんでした。</p>';
            return;
        }
        
        // 検索結果を表示
        users.forEach(user => {
            const card = document.createElement('div');
            card.className = 'friend-card';
            card.setAttribute('data-id', user.id);
            
            card.innerHTML = `
                <div class="friend-info">
                    <div class="friend-name">${user.username}</div>
                </div>
                <div class="friend-actions">
                    <button class="btn small-btn add-friend-btn">フレンド申請</button>
                </div>
            `;
            
            // フレンド申請ボタンのクリックイベント
            card.querySelector('.add-friend-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                sendFriendRequest(user.id);
            });
            
            friendsListContainer.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error searching users:', error);
    }
}

// フレンドリクエスト数をチェック
async function checkFriendRequests() {
    try {
        const response = await fetch(`${API_BASE_URL}/friend/requests?status=pending`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('フレンドリクエストの取得に失敗しました');
        }
        
        const requests = await response.json();
        
        // リクエストバッジを更新
        const badge = document.getElementById('request-badge');
        if (requests.length > 0) {
            badge.textContent = requests.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Error checking friend requests:', error);
    }
}

// フレンドタブの切り替え
function setupFriendTabs() {
    const friendTabs = document.querySelectorAll('.friend-tab');
    friendTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // タブの切り替え
            friendTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // コンテンツの表示切り替え
            const targetId = tab.getAttribute('data-tab') + '-content';
            document.querySelectorAll('.friend-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// フレンド関連のイベントリスナー設定
function setupFriendListeners() {
    // フレンドタブの切り替え
    setupFriendTabs();
    
    // 検索ボタン
    document.getElementById('search-btn').addEventListener('click', () => {
        const query = document.getElementById('friend-search').value.trim();
        if (query) {
            searchUsers(query);
        }
    });
    
    // 検索フィールドのEnterキー
    document.getElementById('friend-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                searchUsers(query);
            }
        }
    });
}
