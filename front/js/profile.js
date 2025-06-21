// プロフィール関連の処理

// Cropper.jsインスタンス
let cropper = null;

// プロフィール画像を生成する関数
function createProfileImage(user, size = '') {
    const container = document.createElement('div');
    
    if (user.profile_image_url) {
        const img = document.createElement('img');
        img.src = user.profile_image_url;
        img.className = `profile-image ${size}`;
        img.alt = `${user.username}のプロフィール画像`;
        container.appendChild(img);
    } else {
        const placeholder = document.createElement('div');
        placeholder.className = `profile-image-placeholder ${size}`;
        placeholder.textContent = user.username.charAt(0).toUpperCase();
        container.appendChild(placeholder);
    }
    
    return container;
}

// ナビゲーションバーのプロフィール画像を更新
function updateNavProfileImage() {
    const navProfileContainer = document.getElementById('nav-user-profile');
    if (currentUser && navProfileContainer) {
        navProfileContainer.innerHTML = '';
        const profileImage = createProfileImage(currentUser, 'small');
        navProfileContainer.appendChild(profileImage);
    }
}

// 現在のプロフィール画像を表示
function displayCurrentProfileImage() {
    const container = document.getElementById('current-profile-image');
    if (currentUser && container) {
        container.innerHTML = '';
        const profileImage = createProfileImage(currentUser, 'large');
        container.appendChild(profileImage);
    }
}

// 画像ファイルをBase64に変換
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// クロップモーダルを開く
function openCropModal(file) {
    const modal = document.getElementById('crop-modal');
    const cropImage = document.getElementById('crop-image');
    const previewContainer = document.getElementById('crop-preview-container');
    
    // モーダルを表示
    modal.classList.remove('hidden');
    
    // ファイルを画像要素に設定
    const reader = new FileReader();
    reader.onload = function(e) {
        cropImage.src = e.target.result;
        
        // 既存のcropperがあれば破棄
        if (cropper) {
            cropper.destroy();
        }
        
        // Cropper.jsを初期化
        cropper = new Cropper(cropImage, {
            aspectRatio: 1, // 正方形
            viewMode: 2,
            dragMode: 'move',
            autoCropArea: 1,
            restore: false,
            guides: false,
            center: false,
            highlight: false,
            cropBoxMovable: false,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            preview: previewContainer,
            ready: function() {
                // クロッパーが準備完了したときの処理
                console.log('Cropper is ready');
            }
        });
    };
    
    reader.readAsDataURL(file);
}

// クロップモーダルを閉じる
function closeCropModal() {
    const modal = document.getElementById('crop-modal');
    modal.classList.add('hidden');
    
    // Cropperインスタンスを破棄
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    // 画像をクリア
    const cropImage = document.getElementById('crop-image');
    cropImage.src = '';
    
    // ファイル入力をクリア
    const fileInput = document.getElementById('profile-image-input');
    fileInput.value = '';
}

// クロップを適用してプロフィール画像を更新
async function applyCrop() {
    if (!cropper) {
        alert('画像が読み込まれていません。');
        return;
    }
    
    try {
        // クロップされた画像をcanvasとして取得
        const canvas = cropper.getCroppedCanvas({
            width: 200,
            height: 200,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });
        
        // canvasをBase64に変換
        const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // プロフィール画像を更新
        await updateProfileImage(croppedImageUrl);
        
        // モーダルを閉じる
        closeCropModal();
        
    } catch (error) {
        console.error('Error applying crop:', error);
        alert('画像のクロップに失敗しました。');
    }
}

// プロフィール画像を更新
async function updateProfileImage(imageUrl) {
    try {
        console.log('Updating profile image...', { imageUrl: imageUrl.substring(0, 50) + '...' });
        
        const response = await fetch(`${API_BASE_URL}/users/me/profile-image`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                profile_image_url: imageUrl
            })
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`プロフィール画像の更新に失敗しました (${response.status}): ${errorText}`);
        }

        const updatedUser = await response.json();
        console.log('Updated user:', updatedUser);
        
        // 現在のユーザー情報を更新
        currentUser.profile_image_url = updatedUser.profile_image_url;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 画面の表示を更新
        displayCurrentProfileImage();
        updateNavProfileImage();
        
        alert('プロフィール画像を更新しました！');
        
    } catch (error) {
        console.error('Error updating profile image:', error);
        alert('プロフィール画像の更新に失敗しました: ' + error.message);
    }
}

// ファイル選択時の処理（クロップモーダル対応版）
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // ファイルサイズチェック（5MB制限）
    if (file.size > 5 * 1024 * 1024) {
        alert('ファイルサイズが大きすぎます。5MB以下の画像を選択してください。');
        return;
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください。');
        return;
    }

    // クロップモーダルを開く
    openCropModal(file);
}

// プロフィール関連のイベントリスナーを設定
function setupProfileListeners() {
    // プロフィール画像アップロードボタン
    document.getElementById('profile-image-upload-btn').addEventListener('click', () => {
        document.getElementById('profile-image-input').click();
    });

    // ファイル選択
    document.getElementById('profile-image-input').addEventListener('change', handleImageUpload);
    
    // クロップモーダルのイベントリスナー
    document.getElementById('crop-modal-close').addEventListener('click', closeCropModal);
    document.getElementById('crop-cancel-btn').addEventListener('click', closeCropModal);
    document.getElementById('crop-apply-btn').addEventListener('click', applyCrop);
    
    // モーダル背景クリックで閉じる
    document.getElementById('crop-modal').addEventListener('click', (e) => {
        if (e.target.id === 'crop-modal') {
            closeCropModal();
        }
    });
}

// プロフィール画面の初期化
function initializeProfileScreen() {
    displayCurrentProfileImage();
}
