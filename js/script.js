const screens = document.querySelectorAll('.screen');
const navLinks = document.querySelectorAll('.nav-link');
const arrows = document.querySelectorAll('.arrow');
let currentIndex = 0;
let startY = 0;
let isSwiping = false;
let isScrolling = false;

// 音频相关
const audioBtn = document.getElementById('audioBtn');
const bgMusic = document.getElementById('bgMusic');
let isPlaying = false;
let audioExists = false;

// 先检查音频是否存在
function checkAudioExists() {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', './music/testmusic.mp3', true);
        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(true);
            } else {
                resolve(false);
            }
        };
        xhr.onerror = function () {
            resolve(false);
        };
        xhr.send();
    });
}

// 初始化音频
async function initAudio() {
    audioExists = await checkAudioExists();

    if (!audioExists) {
        console.log('音频不存在');
        updateAudioBtn();
        return;
    }

    // 音频存在，尝试播放
    try {
        await bgMusic.play();
        isPlaying = true;
    } catch (e) {
        // 自动播放被浏览器阻止，等待用户交互
        isPlaying = false;
    }
    updateAudioBtn();
}

// 更新音频按钮状态
function updateAudioBtn() {
    if (!audioExists) {
        audioBtn.textContent = '🔇';
        return;
    }
    audioBtn.textContent = isPlaying ? '🔊' : '🔇';
}

// 音频按钮点击事件
audioBtn.addEventListener('click', async () => {
    if (!audioExists) {
        console.log('音频不存在');
        return;
    }

    if (isPlaying) {
        bgMusic.pause();
        isPlaying = false;
    } else {
        try {
            await bgMusic.play();
            isPlaying = true;
        } catch (e) {
            console.log('音频无法播放');
        }
    }
    updateAudioBtn();
});

// 页面切换函数
function showScreen(index, direction = 'next') {
    screens.forEach((screen, i) => {
        screen.classList.remove('active', 'prev');
        if (i < index) {
            screen.classList.add('prev');
        } else if (i === index) {
            screen.classList.add('active');
        }
    });
    currentIndex = index;
}

function nextScreen() {
    if (currentIndex < screens.length - 1) {
        showScreen(currentIndex + 1, 'next');
    }
}

function prevScreen() {
    if (currentIndex > 0) {
        showScreen(currentIndex - 1, 'prev');
    }
}

// 点击导航切换
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const targetId = e.target.dataset.target;
        const targetIndex = Array.from(screens).findIndex(s => s.id === targetId);
        if (targetIndex !== -1) {
            const direction = targetIndex > currentIndex ? 'next' : 'prev';
            showScreen(targetIndex, direction);
        }
    });
});

// 点击箭头切换
arrows.forEach(arrow => {
    arrow.addEventListener('click', () => {
        if (arrow.classList.contains('arrow-up')) {
            prevScreen();
        } else if (arrow.classList.contains('arrow-down')) {
            nextScreen();
        }
    });
});

// 滑动切换
const box = document.querySelector('.box');

box.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isSwiping = true;
});

box.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    e.preventDefault();
}, { passive: false });

box.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    const endY = e.changedTouches[0].clientY;
    const deltaY = startY - endY;

    if (Math.abs(deltaY) > 50) {
        if (deltaY > 0) {
            nextScreen();
        } else {
            prevScreen();
        }
    }

    isSwiping = false;
});

// 电脑滚轮切换
box.addEventListener('wheel', (e) => {
    e.preventDefault();

    if (isScrolling) return;
    isScrolling = true;

    if (e.deltaY > 0) {
        nextScreen();
    } else {
        prevScreen();
    }

    setTimeout(() => {
        isScrolling = false;
    }, 600);
}, { passive: false });

// 页面加载完成后初始化
window.addEventListener('load', initAudio);