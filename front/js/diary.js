// 日記関連の処理
let diaryRules = null;
let timerInterval = null;
let remainingTime = 0;

// 日記フィードの読み込み
async function loadDiaryFeed() {
    try {
        const response = await fetch(`${API_BASE_URL}/diary/feed`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('日記の取得に失敗しました');
        }
        
        const diaries = await response.json();
        
        const feedContainer = document.getElementById('diary-feed');
        
        // 空の状態メッセージをクリア
        feedContainer.innerHTML = '';
        
        if (diaries.length === 0) {
            feedContainer.innerHTML = '<p class="empty-state">まだ表示できる日記がありません。<br>フレンドを追加するか、自分で投稿してみましょう！</p>';
            return;
        }
        
        // 日記カードを作成
        diaries.forEach(diary => {
            const card = createDiaryCard(diary);
            feedContainer.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading diary feed:', error);
    }
}

// 自分の日記一覧の読み込み
async function loadMyDiaries() {
    try {
        const response = await fetch(`${API_BASE_URL}/diary/my`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('日記の取得に失敗しました');
        }
        
        const diaries = await response.json();
        
        const diaryListContainer = document.getElementById('my-diary-list');
        
        // 空の状態メッセージをクリア
        diaryListContainer.innerHTML = '';
        
        if (diaries.length === 0) {
            diaryListContainer.innerHTML = '<p class="empty-state">まだ日記を書いていません。<br>右上の「新しい日記」ボタンから投稿してみましょう！</p>';
            return;
        }
        
        // 日記リストアイテムを作成
        diaries.forEach(diary => {
            const listItem = createDiaryListItem(diary);
            diaryListContainer.appendChild(listItem);
        });
        
        // カレンダーも更新
        updateCalendar(diaries);
        
    } catch (error) {
        console.error('Error loading my diaries:', error);
    }
}

// 日記カードの作成
function createDiaryCard(diary) {
    const card = document.createElement('div');
    card.className = 'diary-card';
    card.setAttribute('data-id', diary.id);
    
    // 閲覧可能時間を計算
    const createdDate = new Date(diary.created_at);
    const viewEndTime = new Date(createdDate.getTime() + diary.view_limit_duration_sec * 1000);
    const now = new Date();
    const timeLeftMs = viewEndTime - now;
    
    // 残り時間の表示
    if (timeLeftMs > 0) {
        const minutesLeft = Math.floor(timeLeftMs / 60000);
        const timeLeftElement = document.createElement('div');
        timeLeftElement.className = 'time-left';
        timeLeftElement.textContent = `残り ${minutesLeft} 分`;
        card.appendChild(timeLeftElement);
    }
    
    // カード内容
    card.innerHTML += `
        <div class="diary-header">
            <div class="diary-title">${diary.title || '無題の日記'}</div>
            <div class="diary-author">${diary.user?.username || 'ユーザー'}</div>
            <div class="diary-date">${formatDate(diary.created_at)}</div>
        </div>
        <div class="diary-preview">${diary.content}</div>
        <div class="diary-footer">
            <div class="diary-stats">
                <span><i class="fas fa-eye"></i> ${diary.view_count}</span>
                <span><i class="fas fa-heart"></i> ${diary.like_count}</span>
            </div>
            <div class="diary-rules-mini">
                <span>制限時間: ${formatTime(diary.time_limit_sec)}</span>
            </div>
        </div>
    `;
    
    // クリックイベント
    card.addEventListener('click', () => {
        viewDiaryDetail(diary.id);
    });
    
    return card;
}

// 日記リストアイテムの作成
function createDiaryListItem(diary) {
    const listItem = document.createElement('div');
    listItem.className = 'diary-list-item';
    listItem.setAttribute('data-id', diary.id);
    
    listItem.innerHTML = `
        <div class="diary-title">${diary.title || '無題の日記'}</div>
        <div class="diary-date">${formatDate(diary.created_at)}</div>
        <div class="diary-preview">${diary.content.substring(0, 100)}${diary.content.length > 100 ? '...' : ''}</div>
        <div class="diary-footer">
            <div class="diary-stats">
                <span><i class="fas fa-eye"></i> ${diary.view_count}</span>
                <span><i class="fas fa-heart"></i> ${diary.like_count}</span>
            </div>
        </div>
    `;
    
    // クリックイベント
    listItem.addEventListener('click', () => {
        viewDiaryDetail(diary.id);
    });
    
    return listItem;
}

// カレンダーの更新
function updateCalendar(diaries) {
    const calendarGrid = document.getElementById('calendar-grid');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // カレンダーのタイトル更新
    document.getElementById('calendar-title').textContent = `${currentYear}年${currentMonth + 1}月`;
    
    // カレンダーグリッドをクリア
    calendarGrid.innerHTML = '';
    
    // 曜日ヘッダーを追加
    const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
    daysOfWeek.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // 月の最初の日の曜日を取得
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    
    // 月の日数を取得
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // 日記の日付を整理
    const diaryDates = {};
    diaries.forEach(diary => {
        const diaryDate = new Date(diary.created_at);
        if (diaryDate.getMonth() === currentMonth && diaryDate.getFullYear() === currentYear) {
            const day = diaryDate.getDate();
            diaryDates[day] = true;
        }
    });
    
    // 前月の空白セルを追加
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyCell);
    }
    
    // 日付セルを追加
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        
        // 日記がある日はクラスを追加
        if (diaryDates[day]) {
            dayCell.classList.add('has-diary');
        }
        
        // 今日の日付にはクラスを追加
        if (day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()) {
            dayCell.classList.add('today');
        }
        
        calendarGrid.appendChild(dayCell);
    }
}

// 日記詳細を表示
async function viewDiaryDetail(diaryId) {
    try {
        const response = await fetch(`${API_BASE_URL}/diary/${diaryId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('日記の取得に失敗しました');
        }
        
        const diary = await response.json();
        
        // 詳細画面を表示
        document.getElementById('main-screen').classList.add('hidden');
        document.getElementById('diary-detail-screen').classList.remove('hidden');
        
        // 詳細内容を設定
        document.getElementById('detail-title').textContent = diary.title || '無題の日記';
        document.getElementById('detail-content').textContent = diary.content;
        document.getElementById('detail-author').textContent = diary.user?.username || 'ユーザー';
        document.getElementById('detail-date').textContent = formatDate(diary.created_at);
        document.getElementById('view-count').textContent = diary.view_count;
        document.getElementById('like-count').textContent = diary.like_count;
        document.getElementById('detail-time-limit').textContent = formatTime(diary.time_limit_sec);
        document.getElementById('detail-char-limit').textContent = diary.char_limit === 0 ? '無制限' : `${diary.char_limit}文字`;
        
        // いいねボタンの状態を設定
        const likeBtn = document.getElementById('like-btn');
        likeBtn.setAttribute('data-id', diary.id);
        
        // 閲覧記録を残す（自分の日記でない場合）
        if (diary.user_id !== currentUser.id) {
            await fetch(`${API_BASE_URL}/diary/${diaryId}/view`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        }
        
    } catch (error) {
        console.error('Error viewing diary detail:', error);
    }
}

// 新しい日記を書く
async function startNewDiary() {
    try {
        // ランダムルールを取得
        const response = await fetch(`${API_BASE_URL}/diary/random_rules`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('ルールの取得に失敗しました');
        }
        
        diaryRules = await response.json();
        
        // 日記作成画面を表示
        document.getElementById('main-screen').classList.add('hidden');
        document.getElementById('diary-screen').classList.remove('hidden');
        
        // ルールを表示
        document.getElementById('time-limit').textContent = formatTime(diaryRules.time_limit_sec);
        document.getElementById('char-limit').textContent = diaryRules.char_limit === 0 ? '無制限' : `${diaryRules.char_limit}文字`;
        document.getElementById('max-chars').textContent = diaryRules.char_limit === 0 ? '∞' : diaryRules.char_limit;
        
        // 文字数制限を設定
        const contentArea = document.getElementById('diary-content');
        if (diaryRules.char_limit > 0) {
            contentArea.setAttribute('maxlength', diaryRules.char_limit);
        } else {
            contentArea.removeAttribute('maxlength');
        }
        
        // フォームをリセット
        document.getElementById('diary-title').value = '';
        contentArea.value = '';
        document.getElementById('char-count').textContent = '0';
        
        // タイマーを開始
        startTimer(diaryRules.time_limit_sec);
        
    } catch (error) {
        console.error('Error starting new diary:', error);
    }
}

// タイマーを開始
function startTimer(seconds) {
    // 以前のタイマーがあれば停止
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    remainingTime = seconds;
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();
        
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            // 時間切れで自動投稿
            submitDiary();
        }
    }, 1000);
}

// タイマー表示を更新
function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    document.getElementById('timer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 残り時間が少なくなったら赤く表示
    if (remainingTime <= 30) {
        document.getElementById('timer').style.color = '#dc3545';
    }
}

// 日記を投稿
async function submitDiary() {
    try {
        // タイマーを停止
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        const title = document.getElementById('diary-title').value;
        const content = document.getElementById('diary-content').value;
        
        if (!content.trim()) {
            alert('内容を入力してください');
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/diary`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: title,
                content: content,
                time_limit_sec: diaryRules.time_limit_sec,
                char_limit: diaryRules.char_limit,
                view_limit_duration_sec: diaryRules.view_limit_duration_sec
            })
        });
        
        if (!response.ok) {
            throw new Error('日記の投稿に失敗しました');
        }
        
        // メイン画面に戻る
        document.getElementById('diary-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        
        // 自分の日記一覧を更新
        await loadMyDiaries();
        
        // ホーム画面のフィードも更新
        await loadDiaryFeed();
        
    } catch (error) {
        console.error('Error submitting diary:', error);
        alert('日記の投稿に失敗しました: ' + error.message);
    }
}

// いいね機能
async function toggleLike(diaryId) {
    try {
        const response = await fetch(`${API_BASE_URL}/diary/${diaryId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('いいねの処理に失敗しました');
        }
        
        // いいねカウントを更新
        const likeCount = document.getElementById('like-count');
        const currentCount = parseInt(likeCount.textContent);
        likeCount.textContent = currentCount + 1;
        
        // いいねボタンの見た目を変更
        const likeBtn = document.getElementById('like-btn');
        likeBtn.innerHTML = '<i class="fas fa-heart"></i> いいね済み';
        likeBtn.classList.add('active');
        likeBtn.disabled = true;
        
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

// 日付のフォーマット（日本時間）
function formatDate(dateString) {
    const date = new Date(dateString);
    
    // 日本時間に変換（UTC+9）
    const jstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    
    const year = jstDate.getFullYear();
    const month = jstDate.getMonth() + 1;
    const day = jstDate.getDate();
    const hours = jstDate.getHours().toString().padStart(2, '0');
    const minutes = jstDate.getMinutes().toString().padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

// 時間のフォーマット（秒→分:秒）
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds > 0 ? remainingSeconds + '秒' : ''}`;
}

// 日記関連のイベントリスナー設定
function setupDiaryListeners() {
    // 新しい日記ボタン
    document.getElementById('new-diary-btn').addEventListener('click', () => {
        startNewDiary();
    });
    
    // 日記投稿ボタン
    document.getElementById('submit-diary-btn').addEventListener('click', () => {
        submitDiary();
    });
    
    // 日記キャンセルボタン
    document.getElementById('cancel-diary-btn').addEventListener('click', () => {
        if (confirm('本当にキャンセルしますか？入力した内容は失われます。')) {
            // タイマーを停止
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            document.getElementById('diary-screen').classList.add('hidden');
            document.getElementById('main-screen').classList.remove('hidden');
        }
    });
    
    // 詳細画面の戻るボタン
    document.getElementById('back-btn').addEventListener('click', () => {
        document.getElementById('diary-detail-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
    });
    
    // いいねボタン
    document.getElementById('like-btn').addEventListener('click', () => {
        const diaryId = document.getElementById('like-btn').getAttribute('data-id');
        toggleLike(diaryId);
    });
    
    // 文字数カウンター
    document.getElementById('diary-content').addEventListener('input', (e) => {
        document.getElementById('char-count').textContent = e.target.value.length;
    });
    
    // 前の月ボタン
    document.getElementById('prev-month').addEventListener('click', () => {
        // カレンダー月切り替え処理（実装省略）
    });
    
    // 次の月ボタン
    document.getElementById('next-month').addEventListener('click', () => {
        // カレンダー月切り替え処理（実装省略）
    });
}
