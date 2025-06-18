// 通知関連の処理

// 通知一覧の読み込み
async function loadNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/friend/notifications`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('通知の取得に失敗しました');
        }
        
        const notifications = await response.json();
        
        const notificationsListContainer = document.getElementById('notifications-list');
        
        // 空の状態メッセージをクリア
        notificationsListContainer.innerHTML = '';
        
        if (notifications.length === 0) {
            notificationsListContainer.innerHTML = '<p class="empty-state">通知はありません。</p>';
            // 通知バッジを非表示
            document.getElementById('notification-badge').classList.add('hidden');
            return;
        }
        
        // 通知アイテムを作成
        notifications.forEach(notification => {
            const item = createNotificationItem(notification);
            notificationsListContainer.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// 通知アイテムの作成
function createNotificationItem(notification) {
    const item = document.createElement('div');
    item.className = 'notification-item';
    item.setAttribute('data-id', notification.id);
    
    // 未読の場合はクラスを追加
    if (!notification.is_read) {
        item.classList.add('unread');
    }
    
    item.innerHTML = `
        <div class="notification-message">${notification.message}</div>
        <div class="notification-time">${formatDate(notification.created_at)}</div>
    `;
    
    // クリックイベント（既読にする）
    item.addEventListener('click', () => {
        markNotificationAsRead(notification.id);
    });
    
    return item;
}

// 通知を既読にする
async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/friend/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('通知の既読処理に失敗しました');
        }
        
        // 該当する通知アイテムの未読表示を解除
        const item = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
        if (item) {
            item.classList.remove('unread');
        }
        
        // 未読通知をチェック
        await checkNotifications();
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// すべての通知を既読にする
async function markAllNotificationsAsRead() {
    try {
        const response = await fetch(`${API_BASE_URL}/friend/notifications/read-all`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('全通知の既読処理に失敗しました');
        }
        
        // すべての通知アイテムの未読表示を解除
        document.querySelectorAll('.notification-item').forEach(item => {
            item.classList.remove('unread');
        });
        
        // 通知バッジを非表示
        document.getElementById('notification-badge').classList.add('hidden');
        
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

// 未読通知数をチェック
async function checkNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/friend/notifications?unread_only=true`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('通知の取得に失敗しました');
        }
        
        const notifications = await response.json();
        
        // 通知バッジを更新
        const badge = document.getElementById('notification-badge');
        if (notifications.length > 0) {
            badge.textContent = notifications.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Error checking notifications:', error);
    }
}

// 通知関連のイベントリスナー設定
function setupNotificationListeners() {
    // すべて既読にするボタン
    document.getElementById('mark-all-read-btn').addEventListener('click', () => {
        markAllNotificationsAsRead();
    });
}
