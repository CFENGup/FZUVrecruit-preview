console.log("v0.22118 , only preview")
// ==================== 工作页面内切换+交互逻辑 ====================
const workPage1 = document.getElementById('work-page1');
const workPage2 = document.getElementById('work-page2');
const workPage3 = document.getElementById('work-page3');
const workPage4 = document.getElementById('work-page4');
const workPage5 = document.getElementById('work-page5');
const workPage6 = document.getElementById('work-page6');
const workStartBtn = document.getElementById('workStartBtn');

// 获取所有组元素
const workGroups = document.querySelectorAll('.work-group');
// 获取所有悬挂项、绳子、图标、文本
const hangingItems = document.querySelectorAll('.hanging-item');
const hangingLines = document.querySelectorAll('.hanging-line');
const hangingIcons = document.querySelectorAll('.hanging-icon');
const groupTexts = document.querySelectorAll('.group-text');

// 存储原始绳子长度（初始化时保存）
let originalLineHeights = [];

// 初始化原始长度
function initOriginalHeights() {
    hangingItems.forEach(item => {
        originalLineHeights.push(item.style.getPropertyValue('--line-height'));
    });
}

// 重置所有组的样式（初始状态）
function resetAllGroups() {
    // 恢复摇晃动画
    hangingItems.forEach(item => {
        item.classList.remove('stop-swing');
        item.style.transform = 'rotate(0deg)';
    });
    // 恢复绳子长度、图标、文本样式
    hangingLines.forEach((line, index) => {
        line.classList.remove('shrink');
        // 强制恢复原始长度
        line.style.height = originalLineHeights[index];
    });
    hangingIcons.forEach(icon => {
        icon.classList.remove('shrink');
        icon.style.transform = 'scale(1)';
    });
    groupTexts.forEach(text => {
        text.classList.remove('shrink');
        text.style.transform = 'translateY(0)';
        text.style.opacity = '1';
    });
}

// 收缩非选中的组
function shrinkOtherGroups(activeIndex) {
    // 停止所有摇晃动画
    hangingItems.forEach(item => {
        item.classList.add('stop-swing');
    });

    // 遍历所有组，收缩非选中的
    workGroups.forEach((group, index) => {
        if (index !== activeIndex) {
            // 绳子缩到20px
            hangingLines[index].classList.add('shrink');
            hangingLines[index].style.height = '20px';
            // 图标收缩
            hangingIcons[index].classList.add('shrink');
            // 文本收缩
            groupTexts[index].classList.add('shrink');
        } else {
            // 选中的组：恢复原始长度和样式
            hangingLines[index].classList.remove('shrink');
            hangingLines[index].style.height = originalLineHeights[index];
            hangingIcons[index].classList.remove('shrink');
            groupTexts[index].classList.remove('shrink');
        }
    });
}

// 切换到上下布局
function switchToWorkTopBottom(bottomPage, activeGroupIndex) {
    // 先隐藏所有页面
    workPage1.classList.remove('active');
    workPage2.classList.remove('active');
    workPage3.classList.remove('active');
    workPage4.classList.remove('active');
    workPage5.classList.remove('active');
    workPage6.classList.remove('active');

    // 显示page2（上方）
    workPage2.classList.add('active');

    // 显示指定的下方页面
    if (bottomPage) {
        bottomPage.classList.add('active');
    }

    // 如果指定了选中的组，收缩其他组
    if (activeGroupIndex !== undefined) {
        shrinkOtherGroups(activeGroupIndex);
    } else {
        // 否则重置所有组
        resetAllGroups();
    }
}

// 点击“开始”按钮：切换到page2，重置所有组
if (workStartBtn) {
    workStartBtn.addEventListener('click', () => {
        resetAllGroups();
        switchToWorkTopBottom(null);
    });
}

// 监听每个work-group的点击事件
if (workGroups.length > 0) {
    workGroups.forEach((group, index) => {
        group.addEventListener('click', (e) => {
            e.stopPropagation();

            // 根据组索引获取对应的下方页面
            let targetBottomPage = null;
            switch (index) {
                case 0: // 照片组
                    targetBottomPage = workPage3;
                    break;
                case 1: // 策划组
                    targetBottomPage = workPage4;
                    break;
                case 2: // 摄制组
                    targetBottomPage = workPage5;
                    break;
                case 3: // 综管出镜组
                    targetBottomPage = workPage6;
                    break;
            }

            // 切换页面并收缩其他组
            switchToWorkTopBottom(targetBottomPage, index);
        });
    });
}

// ========== 核心修复：返回按钮点击事件 ==========
const backBtns = document.querySelectorAll('.bottom-back-btn');
backBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. 强制隐藏所有下方页面（page3/4/5/6）
        workPage3.classList.remove('active');
        workPage4.classList.remove('active');
        workPage5.classList.remove('active');
        workPage6.classList.remove('active');

        // 2. 确保page2保持显示
        workPage2.classList.add('active');

        // 3. 强制重置所有组样式（绳子伸出来）
        resetAllGroups();

        // 4. 强制恢复摇晃动画（解决动画不生效问题）
        hangingItems.forEach((item, index) => {
            // 先清除动画，再重新添加
            item.style.animation = 'none';
            item.offsetHeight; // 触发重绘
            item.style.animation = 'swing 3s infinite ease-in-out';
            item.style.animationDelay = `${index * 0.5}s`; // 恢复延迟
        });
    });
});

// ==================== 原有页面切换+音频逻辑 ====================
const screens = document.querySelectorAll('.screen');
const navLinks = document.querySelectorAll('.nav-link');
const arrows = document.querySelectorAll('.arrow');
const progressDots = document.querySelectorAll('.progress-dot');
let currentIndex = 0;
let startY = 0;
let isSwiping = false;
let isScrolling = false;

// 音频相关
const audioBtn = document.getElementById('audioBtn');
const bgMusic = document.getElementById('bgMusic');
let isPlaying = false;
let audioExists = false;

// 检查音频是否存在
function checkAudioExists() {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', './music/testmusic.mp3', true);
        xhr.onload = function () {
            resolve(xhr.status >= 200 && xhr.status < 300);
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
        console.log('音频文件不存在');
        updateAudioBtn();
        return;
    }

    try {
        await bgMusic.play();
        isPlaying = true;
    } catch (e) {
        isPlaying = false;
    }
    updateAudioBtn();
}

// 更新音频按钮状态
function updateAudioBtn() {
    audioBtn.textContent = audioExists && isPlaying ? '🔊' : '🔇';
}

// 音频按钮点击事件
audioBtn.addEventListener('click', async () => {
    if (!audioExists) return;

    if (isPlaying) {
        bgMusic.pause();
        isPlaying = false;
    } else {
        try {
            await bgMusic.play();
            isPlaying = true;
        } catch (e) {
            console.log('音频播放失败');
        }
    }
    updateAudioBtn();
});

// 更新进度条
function updateProgress(index) {
    progressDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

// 页面切换函数
function showScreen(index, direction = 'next') {
    screens.forEach((screen, i) => {
        screen.classList.remove('active', 'prev');
        if (i < index) screen.classList.add('prev');
        else if (i === index) screen.classList.add('active');
    });
    currentIndex = index;
    updateProgress(index);
}

// 上下页切换
function nextScreen() {
    if (currentIndex < screens.length - 1) showScreen(currentIndex + 1, 'next');
}

function prevScreen() {
    if (currentIndex > 0) showScreen(currentIndex - 1, 'prev');
}

// 点击导航切换
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const targetId = e.target.dataset.target;
        const targetIndex = Array.from(screens).findIndex(s => s.id === targetId);
        if (targetIndex !== -1) {
            showScreen(targetIndex, targetIndex > currentIndex ? 'next' : 'prev');
        }
    });
});

// 点击箭头切换
arrows.forEach(arrow => {
    arrow.addEventListener('click', () => {
        arrow.classList.contains('arrow-up') ? prevScreen() : nextScreen();
    });
});

// 点击进度点跳转
progressDots.forEach(dot => {
    dot.addEventListener('click', () => {
        const targetIndex = parseInt(dot.dataset.index);
        showScreen(targetIndex, targetIndex > currentIndex ? 'next' : 'prev');
    });
});

// 滑动切换（移动端）
const box = document.querySelector('.box');
box.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isSwiping = true;
});

box.addEventListener('touchmove', (e) => {
    if (isSwiping) e.preventDefault();
}, { passive: false });

box.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    const endY = e.changedTouches[0].clientY;
    const deltaY = startY - endY;

    if (Math.abs(deltaY) > 50) {
        deltaY > 0 ? nextScreen() : prevScreen();
    }
    isSwiping = false;
});

// 滚轮切换（PC端）
box.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (isScrolling) return;

    isScrolling = true;
    e.deltaY > 0 ? nextScreen() : prevScreen();
    setTimeout(() => isScrolling = false, 600);
}, { passive: false });

// 页面加载完成初始化
window.addEventListener('load', () => {
    initAudio();
    initOriginalHeights(); // 初始化原始绳子长度

});
