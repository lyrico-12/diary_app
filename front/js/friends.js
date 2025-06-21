// フレンド関連の処理

// フレンド一覧の読み込み
async function loadFriends() {
    try {
        console.log('フレンド一覧読み込み開始');
        
        const response = await fetch(`${API_BASE_URL}/friend/list`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('フレンド一覧の取得に失敗しました');
        }
        
        const friends = await response.json();
        console.log('フレンド一覧:', friends);
        
        const friendsListContainer = document.getElementById('friends-list');
        
        // 空の状態メッセージをクリア
        friendsListContainer.innerHTML = '';
        
        if (friends.length === 0) {
            friendsListContainer.innerHTML = '<p class="empty-state">まだフレンドがいません。<br>検索してフレンドを探してみましょう！</p>';
            return;
        }
        
        // フレンドカードを作成（承認済みのフレンドのみ）
        friends.forEach(friend => {
            const card = createFriendCard(friend);
            friendsListContainer.appendChild(card);
        });
        
        console.log('フレンド一覧読み込み完了');
        
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
        console.log('フレンドリクエスト読み込み開始');
        console.log('API_BASE_URL:', API_BASE_URL);
        console.log('authToken:', authToken ? '存在します' : '存在しません');
        
        const response = await fetch(`${API_BASE_URL}/friend/requests?status=pending`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('レスポンスステータス:', response.status);
        console.log('レスポンスOK:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('エラーレスポンス:', errorText);
            throw new Error('フレンドリクエストの取得に失敗しました');
        }
        
        const requests = await response.json();
        
        // デバッグログ
        console.log('フレンドリクエスト:', requests);
        console.log('リクエスト数:', requests.length);
        
        const requestsListContainer = document.getElementById('friend-requests-list');
        console.log('コンテナ要素:', requestsListContainer);
        
        // 空の状態メッセージをクリア
        requestsListContainer.innerHTML = '';
        
        if (requests.length === 0) {
            console.log('リクエストが0件のため、空の状態メッセージを表示');
            requestsListContainer.innerHTML = '<p class="empty-state">フレンドリクエストはありません。</p>';
            // リクエストバッジを非表示
            document.getElementById('request-badge').classList.add('hidden');
            return;
        }
        
        console.log('リクエストアイテムを作成開始');
        
        // リクエストバッジを表示
        const badge = document.getElementById('request-badge');
        badge.textContent = requests.length;
        badge.classList.remove('hidden');
        
        // リクエストアイテムを作成
        requests.forEach((request, index) => {
            console.log(`リクエスト ${index + 1}:`, request);
            const item = createRequestItem(request);
            requestsListContainer.appendChild(item);
        });
        
        console.log('フレンドリクエスト読み込み完了');
        
    } catch (error) {
        console.error('Error loading friend requests:', error);
        console.error('エラーの詳細:', error.message);
        console.error('エラースタック:', error.stack);
    }
}

// フレンドリクエストアイテムの作成
function createRequestItem(request) {
    // デバッグログ
    console.log('リクエストアイテム作成:', request);
    console.log('from_user:', request.from_user);
    console.log('from_user_id:', request.from_user_id);
    
    const item = document.createElement('div');
    item.className = 'request-item';
    item.setAttribute('data-id', request.id);
    
    // ユーザー名を取得（from_userが存在しない場合はIDを表示）
    const username = request.from_user ? request.from_user.username : `ユーザーID: ${request.from_user_id}`;
    
    item.innerHTML = `
        <div class="request-info">
            <div class="request-name">${username}</div>
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
        console.log('フレンドリクエスト承認開始:', requestId);
        
        const response = await fetch(`${API_BASE_URL}/friend/accept/${requestId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'フレンドリクエストの承認に失敗しました');
        }
        
        const result = await response.json();
        console.log('承認結果:', result);
        
        // リクエスト一覧を更新
        await loadFriendRequests();
        
        // フレンド一覧も更新
        await loadFriends();
        
        alert('フレンドリクエストを承認しました');
        
    } catch (error) {
        console.error('Error accepting friend request:', error);
        alert('フレンドリクエストの承認に失敗しました: ' + error.message);
    }
}

// フレンドリクエストを拒否
async function rejectFriendRequest(requestId) {
    try {
        console.log('フレンドリクエスト拒否開始:', requestId);
        
        const response = await fetch(`${API_BASE_URL}/friend/reject/${requestId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'フレンドリクエストの拒否に失敗しました');
        }
        
        const result = await response.json();
        console.log('拒否結果:', result);
        
        // リクエスト一覧を更新
        await loadFriendRequests();
        
        alert('フレンドリクエストを拒否しました');
        
    } catch (error) {
        console.error('Error rejecting friend request:', error);
        alert('フレンドリクエストの拒否に失敗しました: ' + error.message);
    }
}

// フレンドリクエストを送信
async function sendFriendRequest(userId) {
    try {
        console.log('フレンドリクエスト送信開始:', userId);
        
        // ボタンを「申請中」に変更
        const button = document.querySelector(`[data-id="${userId}"] .add-friend-btn`);
        if (button) {
            button.textContent = '申請中...';
            button.disabled = true;
        }
        
        const response = await fetch(`${API_BASE_URL}/friend/request/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'フレンドリクエストの送信に失敗しました');
        }
        
        const result = await response.json();
        console.log('送信結果:', result);
        
        // リクエストのステータスに応じてメッセージを表示
        if (result.status === 'accepted') {
            alert('フレンドリクエストが承認されました！');
            // フレンド一覧を更新
            await loadFriends();
            // 検索結果がある場合は更新
            const searchQuery = document.getElementById('friend-search').value.trim();
            if (searchQuery) {
                await searchUsers(searchQuery);
            }
        } else if (result.status === 'pending') {
            alert('フレンドリクエストを送信しました');
            // ボタンを「申請中」に変更
            if (button) {
                button.textContent = '申請中';
                button.disabled = true;
            }
        } else {
            alert('フレンドリクエストの処理が完了しました');
        }
        
        // フレンドリクエスト一覧も更新
        await loadFriendRequests();
        
    } catch (error) {
        console.error('Error sending friend request:', error);
        alert('フレンドリクエストの送信に失敗しました: ' + error.message);
        
        // エラー時はボタンを元に戻す
        const button = document.querySelector(`[data-id="${userId}"] .add-friend-btn`);
        if (button) {
            button.textContent = 'フレンド申請';
            button.disabled = false;
        }
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
            const errorData = await response.json();
            throw new Error(errorData.detail || 'ユーザー検索に失敗しました');
        }
        
        const users = await response.json();
        
        // 送信済みのフレンドリクエストを取得
        const sentRequestsResponse = await fetch(`${API_BASE_URL}/friend/requests?status=pending`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        let sentRequests = [];
        if (sentRequestsResponse.ok) {
            sentRequests = await sentRequestsResponse.json();
        }
        
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
            
            // 送信済みのリクエストかどうかをチェック
            const isRequestSent = sentRequests.some(request => request.to_user_id === user.id);
            
            card.innerHTML = `
                <div class="friend-info">
                    <div class="friend-name">${user.username}</div>
                </div>
                <div class="friend-actions">
                    <button class="btn small-btn add-friend-btn" ${isRequestSent ? 'disabled' : ''}>
                        ${isRequestSent ? '申請中' : 'フレンド申請'}
                    </button>
                </div>
            `;
            
            // フレンド申請ボタンのクリックイベント
            card.querySelector('.add-friend-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (!isRequestSent) {
                    sendFriendRequest(user.id);
                }
            });
            
            friendsListContainer.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error searching users:', error);
        const friendsListContainer = document.getElementById('friends-list');
        friendsListContainer.innerHTML = `<p class="empty-state">検索エラー: ${error.message}</p>`;
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
    console.log('フレンドタブ設定開始');
    const friendTabs = document.querySelectorAll('.friend-tab');
    console.log('フレンドタブ数:', friendTabs.length);
    
    friendTabs.forEach((tab, index) => {
        console.log(`タブ ${index + 1}:`, tab.textContent, 'data-tab:', tab.getAttribute('data-tab'));
        
        tab.addEventListener('click', () => {
            console.log('タブクリック:', tab.textContent, 'data-tab:', tab.getAttribute('data-tab'));
            
            // タブの切り替え
            friendTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // コンテンツの表示切り替え
            const targetId = tab.getAttribute('data-tab') + '-content';
            console.log('ターゲットID:', targetId);
            
            document.querySelectorAll('.friend-content').forEach(content => {
                content.classList.remove('active');
                content.classList.add('hidden');
            });
            
            const targetContent = document.getElementById(targetId);
            console.log('ターゲットコンテンツ:', targetContent);
            if (targetContent) {
                targetContent.classList.remove('hidden');
                targetContent.classList.add('active');
            }
            
            // タブに応じて適切なデータを読み込む
            if (tab.getAttribute('data-tab') === 'friend-requests') {
                console.log('フレンドリクエストタブがクリックされました。リクエスト一覧を更新します。');
                loadFriendRequests();
            } else if (tab.getAttribute('data-tab') === 'friends-list') {
                console.log('フレンド一覧タブがクリックされました。フレンド一覧を更新します。');
                loadFriends();
            }
        });
    });
    
    console.log('フレンドタブ設定完了');
}

// フレンド関連のイベントリスナー設定
function setupFriendListeners() {
    console.log('フレンドリスナー設定開始');
    
    // フレンドタブの切り替え
    setupFriendTabs();
    
    // 検索ボタン
    const searchBtn = document.getElementById('search-btn');
    console.log('検索ボタン:', searchBtn);
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            console.log('検索ボタンクリック');
            const query = document.getElementById('friend-search').value.trim();
            if (query) {
                searchUsers(query);
            }
        });
    }
    
    // 検索フィールドのEnterキー
    const searchField = document.getElementById('friend-search');
    console.log('検索フィールド:', searchField);
    if (searchField) {
        searchField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('検索フィールドでEnterキー押下');
                const query = e.target.value.trim();
                if (query) {
                    searchUsers(query);
                }
            }
        });
    }
    
    console.log('フレンドリスナー設定完了');
}
