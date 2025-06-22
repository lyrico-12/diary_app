// 日記関連の処理
let diaryRules = null;
let timerInterval = null;
let remainingTime = 0;
let currentCalendarDate = new Date();

// 日記フィードの読み込み
async function loadDiaryFeed() {
    try {
        console.log('=== フレンド日記フィード読み込み開始 ===');
        
        const response = await fetch(`${API_BASE_URL}/diary/feed`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('フィードAPIレスポンス:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('フィードAPIエラー:', errorText);
            throw new Error('日記の取得に失敗しました');
        }
        
        const diaries = await response.json();
        console.log('取得したフレンド日記:', diaries);
        console.log('フレンド日記数:', diaries.length);
        
        const feedContainer = document.getElementById('diary-feed');
        
        // 空の状態メッセージをクリア
        feedContainer.innerHTML = '';
        
        if (diaries.length === 0) {
            console.log('フレンド日記が0件のため、空の状態メッセージを表示');
            feedContainer.innerHTML = '<p class="empty-state">まだ表示できる日記がありません。<br>フレンドを追加するか、自分で投稿してみましょう！</p>';
            return;
        }
        
        console.log('フレンド日記カード作成開始');
        // 日記カードを作成
        diaries.forEach((diary, index) => {
            console.log(`フレンド日記 ${index + 1}:`, diary);
            console.log(`フレンド日記 ${index + 1} のユーザー情報:`, diary.user);
            console.log(`フレンド日記 ${index + 1} のユーザー名:`, diary.user?.username);
            const card = createDiaryCard(diary);
            feedContainer.appendChild(card);
        });
        console.log('フレンド日記カード作成完了');
        console.log('=== フレンド日記フィード読み込み完了 ===');
        
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
        
        // 月ごとのフィードバックセクションを初期化
        await initMonthlyFeedbackSection();
        
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
    
    // フレンドの日記かどうかを判定
    const isFriendDiary = diary.user_id !== currentUserId;
    const authorText = diary.user?.username || 'ユーザー';
    
    // カード内容
    let cardContent = '';
    
    // フレンドの日記の場合はユーザー名をタイトルの上に表示
    if (isFriendDiary) {
        cardContent += `<div class="diary-friend-name">👤 ${authorText}</div>`;
    }
    
    cardContent += `
        <div class="diary-header">
            <div class="diary-title">${diary.title || '無題の日記'}</div>
            <div class="diary-date">${formatDate(diary.created_at)}</div>
        </div>
        <div class="diary-preview">${diary.content}</div>
        <div class="diary-footer">
            <div class="diary-stats">
                <span><i class="fas fa-eye"></i> ${diary.view_count}</span>
                <span class="like-stat"><i class="fas fa-heart"></i> <span class="like-count">${diary.like_count}</span></span>
            </div>
            <div class="diary-actions">
                <button class="like-btn-card" data-id="${diary.id}">
                    <i class="far fa-heart"></i> いいね
                </button>
            </div>
            <div class="diary-rules-mini">
                <span>制限時間: ${formatTime(diary.time_limit_sec)}</span>
            </div>
        </div>
    `;
    
    card.innerHTML += cardContent;
    
    // いいねボタンのイベントリスナーを追加
    const likeBtn = card.querySelector('.like-btn-card');
    likeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // カードのクリックイベントを防ぐ
        toggleLikeFromCard(diary.id, likeBtn, card.querySelector('.like-count'));
    });
    
    // いいね状態を確認して表示を更新
    checkAndUpdateLikeStatus(diary.id, likeBtn);
    
    // カードのクリックイベント（いいねボタン以外の部分）
    card.addEventListener('click', (e) => {
        // いいねボタンがクリックされた場合は詳細画面に移動しない
        if (!e.target.closest('.like-btn-card')) {
            viewDiaryDetail(diary.id);
        }
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

// カレンダーの更新Add commentMore actions
function updateCalendar(diaries) {
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonth = currentCalendarDate.getMonth();
    const currentYear = currentCalendarDate.getFullYear();
    const now = new Date();
    
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

// 日記詳細の表示
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
        document.getElementById('like-btn').setAttribute('data-id', diary.id);

        // ルールを表示
        document.getElementById('detail-time-limit').textContent = formatTime(diary.time_limit_sec);
        document.getElementById('detail-char-limit').textContent = diary.char_limit === 0 ? '無制限' : `${diary.char_limit}文字`;

        // 自分の日記の場合のみ削除ボタンを表示
        const deleteBtn = document.getElementById('delete-diary-btn');
        if (diary.user_id === currentUser.id) {
            deleteBtn.classList.remove('hidden');
            deleteBtn.setAttribute('data-id', diary.id);
        } else {
            deleteBtn.classList.add('hidden');
        }

        // フィードバックセクションの初期化
        initFeedbackSection(diaryId, diary.user_id);
        
        // いいね状態を確認して表示を更新
        const detailLikeBtn = document.getElementById('like-btn');
        await checkAndUpdateLikeStatus(diaryId, detailLikeBtn);
        
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

// フィードバックセクションの初期化と表示制御
async function initFeedbackSection(diaryId, diaryUserId) {
    const feedbackSection = document.getElementById('feedback-section');
    const getFeedbackBtn = document.getElementById('get-feedback-btn');
    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackLoading = document.getElementById('feedback-loading-state');

    // 自分の日記の場合のみフィードバック機能を表示
    if (diaryUserId !== currentUser.id) {
        feedbackSection.classList.add('hidden');
        return;
    }
    feedbackSection.classList.remove('hidden');

    // 初期状態にリセット
    getFeedbackBtn.classList.remove('hidden');
    feedbackContainer.classList.add('hidden');
    feedbackLoading.classList.add('hidden');
    getFeedbackBtn.disabled = false;

    // ボタンにdiaryIdを設定
    getFeedbackBtn.setAttribute('data-id', diaryId);

    // 既存のフィードバックがないか確認
    await fetchAndDisplayFeedback(diaryId);
}

// 既存のフィードバックを取得して表示する
async function fetchAndDisplayFeedback(diaryId) {
    try {
        const response = await fetch(`${API_BASE_URL}/diary/${diaryId}/feedback`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const feedback = await response.json();
            if (feedback && feedback.content) {
                displayFeedback(feedback.content);
            }
        } 
    } catch (error) {
        // 既存フィードバックがない場合はボタンが表示されたままになるので、ここではエラーログのみ
        console.error('Error fetching existing feedback:', error);
    }
}

// フィードバック生成をリクエストする
async function requestFeedback(diaryId) {
    const getFeedbackBtn = document.getElementById('get-feedback-btn');
    const feedbackLoading = document.getElementById('feedback-loading-state');

    getFeedbackBtn.classList.add('hidden');
    feedbackLoading.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/diary/${diaryId}/feedback`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('フィードバックの生成リクエストに失敗しました。');
        }

        // 生成リクエスト後、ポーリングを開始してフィードバックを取得
        pollForFeedback(diaryId);

    } catch (error) {
        console.error('Error requesting feedback:', error);
        alert(error.message);
        // エラー発生時はボタンを再表示
        getFeedbackBtn.classList.remove('hidden');
        feedbackLoading.classList.add('hidden');
    }
}

// フィードバックが生成されるまでポーリングする
function pollForFeedback(diaryId) {
    let attempts = 0;
    const maxAttempts = 10; // 最大10回試行 (合計約30秒)
    const interval = 3000; // 3秒間隔

    const intervalId = setInterval(async () => {
        attempts++;
        try {
            const response = await fetch(`${API_BASE_URL}/diary/${diaryId}/feedback`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const feedback = await response.json();
                if (feedback && feedback.content) {
                    clearInterval(intervalId);
                    displayFeedback(feedback.content);
                    document.getElementById('feedback-loading-state').classList.add('hidden');
                    return;
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
        }

        if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            alert('フィードバックの取得に時間がかかっています。後ほど再度お試しください。');
            document.getElementById('get-feedback-btn').classList.remove('hidden');
            document.getElementById('feedback-loading-state').classList.add('hidden');
        }
    }, interval);
}

// 取得したフィードバックを画面に表示する
function displayFeedback(content) {
    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackContent = document.getElementById('feedback-content');
    
    feedbackContent.textContent = content;
    feedbackContainer.classList.remove('hidden');
    document.getElementById('get-feedback-btn').classList.add('hidden');
}

// 月ごとのフィードバック生成をリクエストする
async function requestMonthlyFeedback(year, month) {
    const getMonthlyFeedbackBtn = document.getElementById('get-monthly-feedback-btn');
    const monthlyFeedbackLoading = document.getElementById('monthly-feedback-loading-state');

    getMonthlyFeedbackBtn.classList.add('hidden');
    monthlyFeedbackLoading.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/diary/monthly-feedback/${year}/${month}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('月ごとフィードバックの生成リクエストに失敗しました。');
        }

        // 生成リクエスト後、ポーリングを開始してフィードバックを取得
        pollForMonthlyFeedback(year, month);

    } catch (error) {
        console.error('Error requesting monthly feedback:', error);
        alert(error.message);
        // エラー発生時はボタンを再表示
        getMonthlyFeedbackBtn.classList.remove('hidden');
        monthlyFeedbackLoading.classList.add('hidden');
    }
}

// 月ごとのフィードバックが生成されるまでポーリングする
function pollForMonthlyFeedback(year, month) {
    let attempts = 0;
    const maxAttempts = 10; // 最大10回試行 (合計約30秒)
    const interval = 3000; // 3秒間隔

    const intervalId = setInterval(async () => {
        attempts++;
        try {
            const response = await fetch(`${API_BASE_URL}/diary/monthly-feedback/${year}/${month}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const feedback = await response.json();
                if (feedback && feedback.content) {
                    clearInterval(intervalId);
                    displayMonthlyFeedback(feedback.content);
                    document.getElementById('monthly-feedback-loading-state').classList.add('hidden');
                    return;
                }
            }
        } catch (error) {
            console.error('Monthly feedback polling error:', error);
        }

        if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            alert('月ごとフィードバックの取得に時間がかかっています。後ほど再度お試しください。');
            document.getElementById('get-monthly-feedback-btn').classList.remove('hidden');
            document.getElementById('monthly-feedback-loading-state').classList.add('hidden');
        }
    }, interval);
}

// 取得した月ごとのフィードバックを画面に表示する
function displayMonthlyFeedback(content) {
    const monthlyFeedbackContainer = document.getElementById('monthly-feedback-container');
    const monthlyFeedbackContent = document.getElementById('monthly-feedback-content');
    
    monthlyFeedbackContent.textContent = content;
    monthlyFeedbackContainer.classList.remove('hidden');
    document.getElementById('get-monthly-feedback-btn').classList.add('hidden');
}

// 既存の月ごとフィードバックを取得して表示する
async function fetchAndDisplayMonthlyFeedback(year, month) {
    try {
        const response = await fetch(`${API_BASE_URL}/diary/monthly-feedback/${year}/${month}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const feedback = await response.json();
            if (feedback && feedback.content) {
                displayMonthlyFeedback(feedback.content);
            }
        } 
    } catch (error) {
        // 既存フィードバックがない場合はボタンが表示されたままになるので、ここではエラーログのみ
        console.error('Error fetching existing monthly feedback:', error);
    }
}

// 月ごとのフィードバックセクションの初期化
async function initMonthlyFeedbackSection() {
    const monthlyFeedbackSection = document.getElementById('monthly-feedback-section');
    const getMonthlyFeedbackBtn = document.getElementById('get-monthly-feedback-btn');
    const monthlyFeedbackContainer = document.getElementById('monthly-feedback-container');
    const monthlyFeedbackLoading = document.getElementById('monthly-feedback-loading-state');

    // 初期状態にリセット
    getMonthlyFeedbackBtn.classList.remove('hidden');
    monthlyFeedbackContainer.classList.add('hidden');
    monthlyFeedbackLoading.classList.add('hidden');
    getMonthlyFeedbackBtn.disabled = false;

    // 現在のカレンダー年月を取得
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth() + 1;

    // ボタンに年月を設定
    getMonthlyFeedbackBtn.setAttribute('data-year', year);
    getMonthlyFeedbackBtn.setAttribute('data-month', month);

    // 既存のフィードバックがないか確認
    await fetchAndDisplayMonthlyFeedback(year, month);
}

// 日記を削除する
async function deleteDiary(diaryId) {
    // 確認ダイアログを表示
    if (!confirm('この日記を削除しますか？\nこの操作は取り消せません。')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/diary/${diaryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('日記の削除に失敗しました');
        }
        
        // 削除成功のメッセージを表示
        alert('日記を削除しました');
        
        // 詳細画面を閉じて自分の日記一覧に戻る
        document.getElementById('diary-detail-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        
        // 自分の日記一覧を表示
        document.getElementById('nav-my-diaries').click();
        
        // 日記一覧を再読み込み
        loadMyDiaries();
        
    } catch (error) {
        console.error('Error deleting diary:', error);
        alert('日記の削除に失敗しました: ' + error.message);
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

// いいね機能（カードから呼び出し）
async function toggleLikeFromCard(diaryId, likeBtn, likeCountElement) {
    try {
        // 現在のいいね状態を確認
        const checkResponse = await fetch(`${API_BASE_URL}/diary/${diaryId}/like`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!checkResponse.ok) {
            throw new Error('いいね状態の確認に失敗しました');
        }
        
        const { is_liked } = await checkResponse.json();
        
        let response;
        if (is_liked) {
            // いいねを取り消す
            response = await fetch(`${API_BASE_URL}/diary/${diaryId}/like`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        } else {
            // いいねを付ける
            response = await fetch(`${API_BASE_URL}/diary/${diaryId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        }
        
        if (!response.ok) {
            throw new Error('いいねの処理に失敗しました');
        }
        
        // いいねカウントを更新
        const currentCount = parseInt(likeCountElement.textContent);
        if (is_liked) {
            // いいねを取り消した場合
            likeCountElement.textContent = Math.max(0, currentCount - 1);
            likeBtn.innerHTML = '<i class="far fa-heart"></i> いいね';
            likeBtn.classList.remove('active');
        } else {
            // いいねを付けた場合
            likeCountElement.textContent = currentCount + 1;
            likeBtn.innerHTML = '<i class="fas fa-heart"></i> いいね済み';
            likeBtn.classList.add('active');
        }
        
        // 詳細画面の対応するボタンも更新
        const detailLikeBtn = document.getElementById('like-btn');
        if (detailLikeBtn && detailLikeBtn.getAttribute('data-id') === diaryId.toString()) {
            const detailLikeCount = document.getElementById('like-count');
            if (detailLikeCount) {
                detailLikeCount.textContent = likeCountElement.textContent;
            }
            if (is_liked) {
                detailLikeBtn.innerHTML = '<i class="far fa-heart"></i> いいね';
                detailLikeBtn.classList.remove('active');
            } else {
                detailLikeBtn.innerHTML = '<i class="fas fa-heart"></i> いいね済み';
                detailLikeBtn.classList.add('active');
            }
        }
        
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}

// いいね状態を確認して表示を更新
async function checkAndUpdateLikeStatus(diaryId, likeBtn) {
    try {
        const response = await fetch(`${API_BASE_URL}/diary/${diaryId}/like`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const { is_liked } = await response.json();
            if (is_liked) {
                likeBtn.innerHTML = '<i class="fas fa-heart"></i> いいね済み';
                likeBtn.classList.add('active');
            } else {
                likeBtn.innerHTML = '<i class="far fa-heart"></i> いいね';
                likeBtn.classList.remove('active');
            }
        }
    } catch (error) {
        console.error('Error checking like status:', error);
    }
}

// いいね機能（詳細画面から呼び出し）
async function toggleLike(diaryId) {
    try {
        // 現在のいいね状態を確認
        const checkResponse = await fetch(`${API_BASE_URL}/diary/${diaryId}/like`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!checkResponse.ok) {
            throw new Error('いいね状態の確認に失敗しました');
        }
        
        const { is_liked } = await checkResponse.json();
        
        let response;
        if (is_liked) {
            // いいねを取り消す
            response = await fetch(`${API_BASE_URL}/diary/${diaryId}/like`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        } else {
            // いいねを付ける
            response = await fetch(`${API_BASE_URL}/diary/${diaryId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        }
        
        if (!response.ok) {
            throw new Error('いいねの処理に失敗しました');
        }
        
        // いいねカウントを更新
        const likeCount = document.getElementById('like-count');
        const currentCount = parseInt(likeCount.textContent);
        if (is_liked) {
            // いいねを取り消した場合
            likeCount.textContent = Math.max(0, currentCount - 1);
        } else {
            // いいねを付けた場合
            likeCount.textContent = currentCount + 1;
        }
        
        // いいねボタンの見た目を変更
        const likeBtn = document.getElementById('like-btn');
        if (is_liked) {
            likeBtn.innerHTML = '<i class="far fa-heart"></i> いいね';
            likeBtn.classList.remove('active');
        } else {
            likeBtn.innerHTML = '<i class="fas fa-heart"></i> いいね済み';
            likeBtn.classList.add('active');
        }
        
        // フィード画面の対応するカードも更新
        const cardLikeBtn = document.querySelector(`.like-btn-card[data-id="${diaryId}"]`);
        if (cardLikeBtn) {
            const cardLikeCount = cardLikeBtn.closest('.diary-card').querySelector('.like-count');
            if (cardLikeCount) {
                cardLikeCount.textContent = likeCount.textContent;
            }
            if (is_liked) {
                cardLikeBtn.innerHTML = '<i class="far fa-heart"></i> いいね';
                cardLikeBtn.classList.remove('active');
            } else {
                cardLikeBtn.innerHTML = '<i class="fas fa-heart"></i> いいね済み';
                cardLikeBtn.classList.add('active');
            }
        }
        
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

    // AIフィードバック取得ボタン
    document.getElementById('get-feedback-btn').addEventListener('click', () => {
        const diaryId = document.getElementById('get-feedback-btn').getAttribute('data-id');
        requestFeedback(diaryId);
    });
    
    // 削除ボタン
    document.getElementById('delete-diary-btn').addEventListener('click', () => {
        const diaryId = document.getElementById('delete-diary-btn').getAttribute('data-id');
        deleteDiary(diaryId);
    });
    
    // 文字数カウンター
    document.getElementById('diary-content').addEventListener('input', (e) => {
        document.getElementById('char-count').textContent = e.target.value.length;
    });
    
    // 前の月ボタン
    document.getElementById('prev-month').addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        loadMyDiaries();
    });
    
    // 次の月ボタン
    document.getElementById('next-month').addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        loadMyDiaries();
    });
    
    // 月ごとフィードバック取得ボタン
    document.getElementById('get-monthly-feedback-btn').addEventListener('click', () => {
        const year = parseInt(document.getElementById('get-monthly-feedback-btn').getAttribute('data-year'));
        const month = parseInt(document.getElementById('get-monthly-feedback-btn').getAttribute('data-month'));
        requestMonthlyFeedback(year, month);
    });
}
