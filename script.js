// =====================================
// 設定とユーティリティ (Configuration)
// =====================================
const CONFIG = {
    // スライダーの初期設定
    sliders: {
        memories: { folder: 'images/memories', count: 22 },
        preshoot: { folder: 'images/preshoot', count: 7 }
    },
    swipeThreshold: 50,     // スワイプ判定の閾値 (px)
};

// =====================================
// スライダークラス (Slider Class)
// =====================================
class Slider {
    constructor(containerId, thumbnailContainerId, slideClass, thumbClass, folder, count) {
        this.containerId = containerId;
        this.thumbnailContainerId = thumbnailContainerId;
        this.slideClass = slideClass;
        this.thumbClass = thumbClass;
        this.folder = folder;
        this.count = count;
        
        this.currentIndex = 1;
        this.touchStartX = 0;
        this.isTransitioning = false;
    }

    build() {
        const container = document.getElementById(this.containerId);
        const thumbnailList = document.querySelector(`#${this.thumbnailContainerId} .thumbnail-list`);

        if (!container || !thumbnailList || this.count === 0) return;

        container.querySelectorAll(`.${this.slideClass}`).forEach(s => s.remove());
        thumbnailList.innerHTML = '';

        const slideFragment = document.createDocumentFragment();
        for (let i = 1; i <= this.count; i++) {
            const slide = document.createElement('div');
            slide.className = `${this.slideClass} fade-slide`;
            if (i === 1) slide.classList.add('active-slide');

            const img = document.createElement('img');
            img.src = `${this.folder}/${String(i).padStart(2, '0')}.jpg`;
            img.alt = `写真 ${i}`;
            img.loading = 'lazy';

            slide.appendChild(img);
            slideFragment.appendChild(slide);
        }

        const arrow = container.querySelector('.prev-arrow');
        container.insertBefore(slideFragment, arrow || null);

        const thumbsFragment = document.createDocumentFragment();
        for (let i = 1; i <= this.count; i++) {
            const thumbItem = document.createElement('div');
            thumbItem.className = this.thumbClass;
            if (i === 1) thumbItem.classList.add('active-thumb');
            
            thumbItem.setAttribute('role', 'button');
            thumbItem.setAttribute('aria-label', `写真 ${i}を表示`);
            thumbItem.onclick = () => this.goToSlide(i);

            const img = document.createElement('img');
            img.src = `${this.folder}/${String(i).padStart(2, '0')}.jpg`;
            img.alt = `写真 ${i} のサムネイル`;
            img.loading = 'lazy';

            thumbItem.appendChild(img);
            thumbsFragment.appendChild(thumbItem);
        }
        thumbnailList.appendChild(thumbsFragment);

        this.setupEventListeners(container);
    }

    setupEventListeners(container) {
        container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            if (this.isTransitioning) return;
            const touchEndX = e.changedTouches[0].clientX;
            const diff = this.touchStartX - touchEndX;
            
            if (Math.abs(diff) > CONFIG.swipeThreshold) {
                this.navigate(diff > 0 ? 1 : -1);
            }
        }, { passive: true });

        container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.navigate(-1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); this.navigate(1); }
        });
    }

    navigate(direction) {
        if (this.isTransitioning) return;
        this.show(this.currentIndex + direction);
    }

    goToSlide(index) {
        if (this.isTransitioning) return;
        this.show(index);
    }

    show(n) {
        const container = document.getElementById(this.containerId);
        const thumbnailList = document.querySelector(`#${this.thumbnailContainerId} .thumbnail-list`);
        if (!container || !thumbnailList) return;

        const slides = container.getElementsByClassName(this.slideClass);
        const thumbs = thumbnailList.getElementsByClassName(this.thumbClass);
        if (slides.length === 0) return;

        if (n > slides.length) this.currentIndex = 1;
        else if (n < 1) this.currentIndex = slides.length;
        else this.currentIndex = n;

        Array.from(slides).forEach(slide => slide.classList.remove('active-slide'));
        Array.from(thumbs).forEach(thumb => thumb.classList.remove('active-thumb'));

        if (slides[this.currentIndex - 1]) {
            slides[this.currentIndex - 1].classList.add('active-slide');
        }
        if (thumbs[this.currentIndex - 1]) {
            const activeThumb = thumbs[this.currentIndex - 1];
            activeThumb.classList.add('active-thumb');
            this.scrollThumbToVisible(activeThumb);
        }

        this.isTransitioning = true;
        setTimeout(() => {
            this.isTransitioning = false;
        }, 100);
    }
    
    scrollThumbToVisible(thumbElement) {
        if (thumbElement) {
            thumbElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    }

    focus() {
        const activeThumb = document.querySelector(`#${this.thumbnailContainerId} .active-thumb`);
        this.scrollThumbToVisible(activeThumb);
    }
}

// =====================================
// 初期化関数 (Initialization)
// =====================================
let memoriesSlider, preshootSlider;

async function initSliders() {
    try {
        const response = await fetch('config.json');
        if (response.ok) {
            const jsonConfig = await response.json();
            if(jsonConfig.sliders) {
                Object.assign(CONFIG.sliders.memories, jsonConfig.sliders.memories || {});
                Object.assign(CONFIG.sliders.preshoot, jsonConfig.sliders.preshoot || {});
            }
        }
    } catch (error) {
        console.warn('config.json読み込みスキップ', error);
    }

    const { memories, preshoot } = CONFIG.sliders;
    if (memories.count > 0) {
        memoriesSlider = new Slider('slideshow', 'thumbnailMemories', 'mySlides', 'thumbnail-item', memories.folder, memories.count);
        memoriesSlider.build();
    }
    if (preshoot.count > 0) {
        preshootSlider = new Slider('slideshowPre', 'thumbnailPreshoot', 'mySlidesPre', 'thumbnail-item', preshoot.folder, preshoot.count);
        preshootSlider.build();
    }

    setTimeout(hideLoading, 100);
}

function plusSlides(n) { if (memoriesSlider) memoriesSlider.navigate(n); }
function plusSlidesPre(n) { if (preshootSlider) preshootSlider.navigate(n); }

// =====================================
// 各種UI制御 (UI Controls)
// =====================================

function initTabs(tabSelector, contentSelector) {
    const tabBtns = document.querySelectorAll(tabSelector);
    const contents = document.querySelectorAll(contentSelector);

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) return;
            
            const targetId = btn.getAttribute('data-target');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            contents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetId) content.classList.add('active');
            });

            if (btn.closest('#gallery')) {
                if (targetId === 'memories-content') {
                    if (memoriesSlider) memoriesSlider.focus();
                } else if (targetId === 'preshoot-content') {
                    if (preshootSlider) preshootSlider.focus();
                }
            }
        });
    });
}

// Gallery auto-scroll observers removed to prevent scroll jank

function initModals() {
    const menuModal = document.getElementById('menuModal');
    const imgModal = document.getElementById('imgModal');
    const openMenuBtn = document.getElementById('openMenuModal');
    const seatingChartImg = document.getElementById('seatingChartImg');
    const expandedImg = document.getElementById('expandedImg');

    openMenuBtn.onclick = () => {
        menuModal.classList.add('is-active');
        document.body.style.overflow = 'hidden';
    };

    seatingChartImg.onclick = () => {
        imgModal.classList.add('is-active');
        expandedImg.src = seatingChartImg.src;
        document.body.style.overflow = 'hidden';
    };

    document.querySelectorAll('.modal .close-btn').forEach(btn => {
        btn.onclick = function() {
            this.closest('.modal').classList.remove('is-active');
            document.body.style.overflow = '';
        };
    });

    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('is-active');
            document.body.style.overflow = '';
        }
    };

    document.querySelectorAll('#menuModal a').forEach(link => {
        link.onclick = (e) => {
            const targetId = link.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                menuModal.classList.remove('is-active');
                document.body.style.overflow = '';
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const offsetPosition = targetElement.offsetTop - 40;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
            }
        };
    });
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.visibility = 'hidden'; overlay.style.display = 'none'; }, 500);
}

// =====================================
// 実行開始 (Main Execution)
// =====================================
document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    initModals();
    initSliders().then(() => {
        initTabs('#gallery .tab-btn', '.gallery-panel');

        const initialGalleryTab = document.querySelector('#gallery .tab-btn[data-target="memories-content"]');
        if (initialGalleryTab) initialGalleryTab.classList.add('active');
        
        const initialGalleryContent = document.getElementById('memories-content');
        if (initialGalleryContent) initialGalleryContent.classList.add('active');
    });
});
