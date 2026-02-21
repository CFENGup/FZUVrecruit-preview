alert("v0.22202 preview only    最后发布时间2.22 02:16    刮刮乐暂时只能用鼠标点开，手机触摸还没做适配");
console.log("v0.22202 only preview   最后发布时间2.22 02:16");
// ==================== 全局禁止文字选中/拖动（防蓝框） ====================
document.addEventListener('selectstart', (e) => e.preventDefault());
document.addEventListener('dragstart', (e) => e.preventDefault());
window.addEventListener('mousedown', (e) => { if (e.button === 0) e.preventDefault(); });

// ==================== 全局变量与核心元素获取 ====================
const workPage1 = document.getElementById('work-page1');
const workPage2 = document.getElementById('work-page2');
const workPage3 = document.getElementById('work-page3');
const workPage4 = document.getElementById('work-page4');
const workPage5 = document.getElementById('work-page5');
const workPage6 = document.getElementById('work-page6');
const workStartBtn = document.getElementById('workStartBtn');

const workGroups = document.querySelectorAll('.work-group');
const hangingItems = document.querySelectorAll('.hanging-item');
const hangingLines = document.querySelectorAll('.hanging-line');
const hangingIcons = document.querySelectorAll('.hanging-icon');
const groupTexts = document.querySelectorAll('.group-text');

const screens = document.querySelectorAll('.screen');
const navLinks = document.querySelectorAll('.nav-link');
const arrows = document.querySelectorAll('.arrow');
const progressDots = document.querySelectorAll('.progress-dot');

const audioBtn = document.getElementById('audioBtn');
const bgMusic = document.getElementById('bgMusic');

let originalLineHeights = [];
let currentIndex = 0;
let startY = 0;
let isSwiping = false;
let isScrolling = false;
let isPlaying = false;
let audioExists = false;

// ==================== 工作页面摆动与切换逻辑 ====================
function initOriginalHeights() {
    hangingItems.forEach(item => originalLineHeights.push(item.style.getPropertyValue('--line-height')));
}

function initSwingAnimations() {
    const swingConfigs = [
        { anim: 'swing-left', duration: '3.2s', delay: '0.1s' },
        { anim: 'swing-right', duration: '2.8s', delay: '0.2s' },
        { anim: 'swing-slow', duration: '3.5s', delay: '0.05s' },
        { anim: 'swing-fast', duration: '2.5s', delay: '0.15s' }
    ];
    hangingItems.forEach((item, index) => {
        const config = swingConfigs[index] || { anim: 'swing', duration: '3s', delay: '0s' };
        item.style.animation = `${config.anim} ${config.duration} infinite ease-in-out`;
        item.style.animationDelay = config.delay;
        item.classList.remove('stop-swing');
    });
}

function resetAllGroups() {
    initSwingAnimations();
    hangingLines.forEach((line, index) => {
        line.classList.remove('shrink');
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

function shrinkOtherGroups(activeIndex) {
    hangingItems.forEach(item => {
        item.classList.add('stop-swing');
        item.style.animation = 'none';
        item.style.transform = 'rotate(0deg)';
    });
    workGroups.forEach((group, index) => {
        if (index !== activeIndex) {
            hangingLines[index].classList.add('shrink');
            hangingLines[index].style.height = '20px';
            hangingIcons[index].classList.add('shrink');
            groupTexts[index].classList.add('shrink');
        } else {
            hangingLines[index].classList.remove('shrink');
            hangingLines[index].style.height = originalLineHeights[index];
            hangingIcons[index].classList.remove('shrink');
            groupTexts[index].classList.remove('shrink');
        }
    });
}

function switchToWorkTopBottom(bottomPage, activeIndex) {
    [workPage1, workPage2, workPage3, workPage4, workPage5, workPage6].forEach(page => page.classList.remove('active'));
    workPage2.classList.add('active');
    if (bottomPage) bottomPage.classList.add('active');
    activeIndex !== undefined ? shrinkOtherGroups(activeIndex) : resetAllGroups();
}

// ==================== 音频逻辑 ====================
function checkAudioExists() {
    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', './music/testmusic.mp3', true);
        xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
        xhr.onerror = () => resolve(false);
        xhr.send();
    });
}

async function initAudio() {
    audioExists = await checkAudioExists();
    if (!audioExists) { updateAudioBtn(); return; }
    try {
        await bgMusic.play();
        isPlaying = true;
    } catch (e) { isPlaying = false; }
    updateAudioBtn();
}

function updateAudioBtn() { if (audioBtn) audioBtn.textContent = audioExists && isPlaying ? '🔊' : '🔇'; }

// ==================== 页面切换逻辑 ====================
function updateProgress(index) { progressDots.forEach((dot, i) => dot.classList.toggle('active', i === index)); }

function showScreen(index, direction = 'next') {
    screens.forEach((screen, i) => {
        screen.classList.remove('active', 'prev');
        if (i < index) screen.classList.add('prev');
        else if (i === index) screen.classList.add('active');
    });
    currentIndex = index;
    updateProgress(index);
}

function nextScreen() { if (currentIndex < screens.length - 1) showScreen(currentIndex + 1, 'next'); }
function prevScreen() { if (currentIndex > 0) showScreen(currentIndex - 1, 'prev'); }

// ==================== 刮刮乐效果逻辑（带滑动检测） ====================
function initSingleScratchCard(scratchCard) {
    const canvas = scratchCard.querySelector('.scratch-card-canvas');
    const textEl = scratchCard.querySelector('.scratch-card-text');
    if (!canvas || !textEl) return;

    const ctx = canvas.getContext('2d');
    const containerWidth = scratchCard.offsetWidth;
    const containerHeight = scratchCard.offsetHeight;
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#999999';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let isScratching = false;
    let hasMoved = false;
    let startX, startY;

    function drawScratch(x, y) {
        if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    // PC端
    canvas.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isScratching = true;
        hasMoved = false;
        startX = e.clientX;
        startY = e.clientY;
        const rect = canvas.getBoundingClientRect();
        drawScratch(e.clientX - rect.left, e.clientY - rect.top);
    });

    document.addEventListener('mousemove', (e) => {
        if (!isScratching) return;
        if (!hasMoved && (Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5)) hasMoved = true;
        const rect = canvas.getBoundingClientRect();
        drawScratch(e.clientX - rect.left, e.clientY - rect.top);
    });

    document.addEventListener('mouseup', () => {
        if (isScratching) {
            if (hasMoved) {
                canvas.dataset.ignoreClick = 'true';
                setTimeout(() => delete canvas.dataset.ignoreClick, 300);
            }
            isScratching = false;
        }
    });

    // 移动端
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isScratching = true;
        hasMoved = false;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        const rect = canvas.getBoundingClientRect();
        drawScratch(touch.clientX - rect.left, touch.clientY - rect.top);
    });

    document.addEventListener('touchmove', (e) => {
        if (!isScratching) return;
        e.preventDefault();
        const touch = e.touches[0];
        if (!hasMoved && (Math.abs(touch.clientX - startX) > 5 || Math.abs(touch.clientY - startY) > 5)) hasMoved = true;
        const rect = canvas.getBoundingClientRect();
        drawScratch(touch.clientX - rect.left, touch.clientY - rect.top);
    });

    document.addEventListener('touchend', () => {
        if (isScratching) {
            if (hasMoved) {
                canvas.dataset.ignoreClick = 'true';
                setTimeout(() => delete canvas.dataset.ignoreClick, 300);
            }
            isScratching = false;
        }
    });
}

function initScratchCard() {
    const allScratchCards = document.querySelectorAll('.scratch-card');
    if (!allScratchCards.length) return;
    allScratchCards.forEach(card => initSingleScratchCard(card));
    window.addEventListener('resize', () => allScratchCards.forEach(card => initSingleScratchCard(card)));
}

// ==================== 事件绑定 ====================
function bindEvents() {
    if (workStartBtn) workStartBtn.addEventListener('click', () => { resetAllGroups(); switchToWorkTopBottom(null); });

    const backBtns = document.querySelectorAll('.bottom-back-btn');
    backBtns.forEach(btn => btn.addEventListener('click', () => {
        [workPage3, workPage4, workPage5, workPage6].forEach(p => p.classList.remove('active'));
        workPage2.classList.add('active');
        resetAllGroups();
    }));

    if (audioBtn) audioBtn.addEventListener('click', async () => {
        if (!audioExists) return;
        if (isPlaying) { bgMusic.pause(); isPlaying = false; }
        else { try { await bgMusic.play(); isPlaying = true; } catch (e) { } }
        updateAudioBtn();
    });

    navLinks.forEach(link => link.addEventListener('click', (e) => {
        const targetId = e.target.dataset.target;
        const targetIndex = Array.from(screens).findIndex(s => s.id === targetId);
        if (targetIndex !== -1) showScreen(targetIndex, targetIndex > currentIndex ? 'next' : 'prev');
    }));

    arrows.forEach(arrow => arrow.addEventListener('click', () => arrow.classList.contains('arrow-up') ? prevScreen() : nextScreen()));

    progressDots.forEach(dot => dot.addEventListener('click', () => {
        const targetIndex = parseInt(dot.dataset.index);
        showScreen(targetIndex, targetIndex > currentIndex ? 'next' : 'prev');
    }));

    const box = document.querySelector('.box');
    if (box) {
        box.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; isSwiping = true; });
        box.addEventListener('touchmove', (e) => { if (isSwiping) e.preventDefault(); }, { passive: false });
        box.addEventListener('touchend', (e) => {
            if (!isSwiping) return;
            const endY = e.changedTouches[0].clientY;
            const deltaY = startY - endY;
            if (Math.abs(deltaY) > 50) deltaY > 0 ? nextScreen() : prevScreen();
            isSwiping = false;
        });
        box.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (isScrolling) return;
            isScrolling = true;
            e.deltaY > 0 ? nextScreen() : prevScreen();
            setTimeout(() => isScrolling = false, 600);
        }, { passive: false });
    }

    const screenWork = document.getElementById('screen-work');
    if (screenWork) screenWork.addEventListener('click', (e) => {
        const workGroup = e.target.closest('.work-group');
        if (workGroup) {
            e.stopPropagation();
            const groupIndex = Array.from(workGroups).indexOf(workGroup);
            let targetBottomPage = null;
            switch (groupIndex) {
                case 0: targetBottomPage = workPage3; break;
                case 1: targetBottomPage = workPage4; break;
                case 2: targetBottomPage = workPage5; break;
                case 3: targetBottomPage = workPage6; break;
            }
            switchToWorkTopBottom(targetBottomPage, groupIndex);
            return;
        }
    });
}

// ==================== 页面初始化 ====================
window.addEventListener('DOMContentLoaded', async () => {
    initOriginalHeights();
    bindEvents();
    await initAudio();
    setTimeout(initScratchCard, 100);
    showScreen(0);
    if (workPage2?.classList.contains('active')) initSwingAnimations();
});

window.addEventListener('resize', () => {
    initScratchCard();
    if (workPage2?.classList.contains('active')) initSwingAnimations();
});

// ==================== 四个弹出层逻辑（统一为立即执行函数，监听canvas点击） ====================

// 运动会
(function () {
    const popup = document.getElementById('sportsPopup');
    const closeBtn = document.getElementById('popupCloseBtn');
    const scratchCard = Array.from(document.querySelectorAll('.scratch-card')).find(card =>
        card.querySelector('.scratch-card-text').textContent === '运动会'
    );
    if (!popup || !closeBtn || !scratchCard) return;
    const canvas = scratchCard.querySelector('.scratch-card-canvas');
    if (!canvas) return;

    function showPopup() { popup.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function hidePopup() { popup.classList.remove('active'); document.body.style.overflow = 'auto'; }

    canvas.addEventListener('click', (e) => {
        if (canvas.dataset.ignoreClick) {
            delete canvas.dataset.ignoreClick;
            e.stopPropagation();
            return;
        }
        e.stopPropagation();
        showPopup();
    });

    closeBtn.addEventListener('click', hidePopup);
    popup.addEventListener('click', (e) => { if (e.target === popup) hidePopup(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && popup.classList.contains('active')) hidePopup(); });
})();

// 摄影展
(function () {
    const popup = document.getElementById('photoExhibitionPopup');
    const closeBtn = document.getElementById('photoExhibitionCloseBtn');
    const scratchCard = Array.from(document.querySelectorAll('.scratch-card')).find(card =>
        card.querySelector('.scratch-card-text').textContent === '摄影展'
    );
    if (!popup || !closeBtn || !scratchCard) return;
    const canvas = scratchCard.querySelector('.scratch-card-canvas');
    if (!canvas) return;

    function showPopup() { popup.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function hidePopup() { popup.classList.remove('active'); document.body.style.overflow = 'auto'; }

    canvas.addEventListener('click', (e) => {
        if (canvas.dataset.ignoreClick) {
            delete canvas.dataset.ignoreClick;
            e.stopPropagation();
            return;
        }
        e.stopPropagation();
        showPopup();
    });

    closeBtn.addEventListener('click', hidePopup);
    popup.addEventListener('click', (e) => { if (e.target === popup) hidePopup(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && popup.classList.contains('active')) hidePopup(); });
})();

// 新年晚会
(function () {
    const popup = document.getElementById('newYearGalaPopup');
    const closeBtn = document.getElementById('newYearGalaCloseBtn');
    const scratchCard = Array.from(document.querySelectorAll('.scratch-card')).find(card =>
        card.querySelector('.scratch-card-text').textContent === '新年晚会'
    );
    if (!popup || !closeBtn || !scratchCard) return;
    const canvas = scratchCard.querySelector('.scratch-card-canvas');
    if (!canvas) return;

    function showPopup() { popup.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function hidePopup() { popup.classList.remove('active'); document.body.style.overflow = 'auto'; }

    canvas.addEventListener('click', (e) => {
        if (canvas.dataset.ignoreClick) {
            delete canvas.dataset.ignoreClick;
            e.stopPropagation();
            return;
        }
        e.stopPropagation();
        showPopup();
    });

    closeBtn.addEventListener('click', hidePopup);
    popup.addEventListener('click', (e) => { if (e.target === popup) hidePopup(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && popup.classList.contains('active')) hidePopup(); });
})();

// 微电影
(function () {
    const popup = document.getElementById('microFilmPopup');
    const closeBtn = document.getElementById('microFilmCloseBtn');
    const scratchCard = Array.from(document.querySelectorAll('.scratch-card')).find(card =>
        card.querySelector('.scratch-card-text').textContent === '微电影'
    );
    if (!popup || !closeBtn || !scratchCard) return;
    const canvas = scratchCard.querySelector('.scratch-card-canvas');
    if (!canvas) return;

    function showPopup() { popup.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function hidePopup() { popup.classList.remove('active'); document.body.style.overflow = 'auto'; }

    canvas.addEventListener('click', (e) => {
        if (canvas.dataset.ignoreClick) {
            delete canvas.dataset.ignoreClick;
            e.stopPropagation();
            return;
        }
        e.stopPropagation();
        showPopup();
    });

    closeBtn.addEventListener('click', hidePopup);
    popup.addEventListener('click', (e) => { if (e.target === popup) hidePopup(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && popup.classList.contains('active')) hidePopup(); });
})();

// ==================== 轮播初始化 ====================
window.addEventListener('load', () => {
    setTimeout(() => {
        initSportsCarousel();
        initPhotoExhibitionCarousel();
        initNewYearGalaCarousel();
        initMicroFilmCarousel();
    }, 300);
});

function initSportsCarousel() {
    const popup = document.getElementById('sportsPopup');
    if (!popup) return;
    const carouselSlides = popup.querySelector('.carousel-slides');
    const carouselDots = popup.querySelectorAll('.carousel-dot');
    if (!carouselSlides || carouselDots.length === 0) return;

    let currentSlide = 0;
    const slideCount = 3;
    const intervalTime = 1000;
    let interval = null;

    function updateCarousel() {
        const offset = -currentSlide * (100 / slideCount);
        carouselSlides.style.transform = `translateX(${offset}%)`;
        carouselDots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
    }
    function nextSlide() { currentSlide = (currentSlide + 1) % slideCount; updateCarousel(); }
    function startCarousel() { currentSlide = 0; updateCarousel(); interval = setInterval(nextSlide, intervalTime); }
    function stopCarousel() { clearInterval(interval); currentSlide = 0; updateCarousel(); }

    const canvas = popup.previousElementSibling?.querySelector('.scratch-card-canvas'); // 不精确，改用根据文本查找
    const scratchCard = Array.from(document.querySelectorAll('.scratch-card')).find(card =>
        card.querySelector('.scratch-card-text').textContent === '运动会'
    );
    if (scratchCard) {
        const canvas = scratchCard.querySelector('.scratch-card-canvas');
        if (canvas) {
            canvas.addEventListener('click', () => setTimeout(startCarousel, 200));
        }
    }

    const closeBtn = document.getElementById('popupCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', stopCarousel);
    popup.addEventListener('click', (e) => { if (e.target === popup) stopCarousel(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && popup.classList.contains('active')) stopCarousel(); });
    carouselDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
            clearInterval(interval);
            interval = setInterval(nextSlide, intervalTime);
        });
    });
}

function initPhotoExhibitionCarousel() {
    const popup = document.getElementById('photoExhibitionPopup');
    if (!popup) return;
    const carouselSlides = popup.querySelector('.carousel-slides');
    const carouselDots = popup.querySelectorAll('.carousel-dot');
    if (!carouselSlides || carouselDots.length === 0) return;

    let currentSlide = 0;
    const slideCount = 2;
    const intervalTime = 1000;
    let interval = null;

    function updateCarousel() {
        const offset = -currentSlide * (100 / slideCount);
        carouselSlides.style.transform = `translateX(${offset}%)`;
        carouselDots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
    }
    function nextSlide() { currentSlide = (currentSlide + 1) % slideCount; updateCarousel(); }
    function startCarousel() { currentSlide = 0; updateCarousel(); interval = setInterval(nextSlide, intervalTime); }
    function stopCarousel() { clearInterval(interval); currentSlide = 0; updateCarousel(); }

    const scratchCard = Array.from(document.querySelectorAll('.scratch-card')).find(card =>
        card.querySelector('.scratch-card-text').textContent === '摄影展'
    );
    if (scratchCard) {
        const canvas = scratchCard.querySelector('.scratch-card-canvas');
        if (canvas) canvas.addEventListener('click', () => setTimeout(startCarousel, 200));
    }

    const closeBtn = document.getElementById('photoExhibitionCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', stopCarousel);
    popup.addEventListener('click', (e) => { if (e.target === popup) stopCarousel(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && popup.classList.contains('active')) stopCarousel(); });
    carouselDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
            clearInterval(interval);
            interval = setInterval(nextSlide, intervalTime);
        });
    });
}

function initNewYearGalaCarousel() {
    const popup = document.getElementById('newYearGalaPopup');
    if (!popup) return;
    const carouselSlides = popup.querySelector('.carousel-slides');
    const carouselDots = popup.querySelectorAll('.carousel-dot');
    if (!carouselSlides || carouselDots.length === 0) return;

    let currentSlide = 0;
    const slideCount = 1;
    const intervalTime = 1000;
    let interval = null;

    function updateCarousel() {
        const offset = -currentSlide * (100 / slideCount);
        carouselSlides.style.transform = `translateX(${offset}%)`;
        carouselDots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
    }
    function nextSlide() { currentSlide = (currentSlide + 1) % slideCount; updateCarousel(); }
    function startCarousel() { currentSlide = 0; updateCarousel(); interval = setInterval(nextSlide, intervalTime); }
    function stopCarousel() { clearInterval(interval); currentSlide = 0; updateCarousel(); }

    const scratchCard = Array.from(document.querySelectorAll('.scratch-card')).find(card =>
        card.querySelector('.scratch-card-text').textContent === '新年晚会'
    );
    if (scratchCard) {
        const canvas = scratchCard.querySelector('.scratch-card-canvas');
        if (canvas) canvas.addEventListener('click', () => setTimeout(startCarousel, 200));
    }

    const closeBtn = document.getElementById('newYearGalaCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', stopCarousel);
    popup.addEventListener('click', (e) => { if (e.target === popup) stopCarousel(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && popup.classList.contains('active')) stopCarousel(); });
    carouselDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
            clearInterval(interval);
            interval = setInterval(nextSlide, intervalTime);
        });
    });
}

function initMicroFilmCarousel() {
    const popup = document.getElementById('microFilmPopup');
    if (!popup) return;
    const carouselSlides = popup.querySelector('.carousel-slides');
    const carouselDots = popup.querySelectorAll('.carousel-dot');
    if (!carouselSlides || carouselDots.length === 0) return;

    let currentSlide = 0;
    const slideCount = 2;
    const intervalTime = 1000;
    let interval = null;

    function updateCarousel() {
        const offset = -currentSlide * (100 / slideCount);
        carouselSlides.style.transform = `translateX(${offset}%)`;
        carouselDots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
    }
    function nextSlide() { currentSlide = (currentSlide + 1) % slideCount; updateCarousel(); }
    function startCarousel() { currentSlide = 0; updateCarousel(); interval = setInterval(nextSlide, intervalTime); }
    function stopCarousel() { clearInterval(interval); currentSlide = 0; updateCarousel(); }

    const scratchCard = Array.from(document.querySelectorAll('.scratch-card')).find(card =>
        card.querySelector('.scratch-card-text').textContent === '微电影'
    );
    if (scratchCard) {
        const canvas = scratchCard.querySelector('.scratch-card-canvas');
        if (canvas) canvas.addEventListener('click', () => setTimeout(startCarousel, 200));
    }

    const closeBtn = document.getElementById('microFilmCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', stopCarousel);
    popup.addEventListener('click', (e) => { if (e.target === popup) stopCarousel(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && popup.classList.contains('active')) stopCarousel(); });
    carouselDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
            clearInterval(interval);
            interval = setInterval(nextSlide, intervalTime);
        });
    });
}
