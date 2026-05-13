// PikaWalls Logic - Premium Wallpaper Site
const grid = document.getElementById('wallpaper-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-button');
const chips = document.querySelectorAll('.cat-chip');
const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const closeModal = document.querySelector('.close-modal');
const modalDownload = document.getElementById('modal-download-link');
const modalFrame = document.getElementById('modal-frame');

// PEXELS API CONFIG
// Note: Get your free key at https://www.pexels.com/api/
const PEXELS_API_KEY = 'IFSBAPA3642m8t9hPEZnIfp6t82veqSDpFX4EJ27HkGPKPrG89UcTdZe'; 

let currentQuery = 'Nature';
let currentOrientation = 'all'; // all, portrait, landscape
let currentMediaType = 'photos'; // photos, videos
let isLoading = false;
let page = 1;
let favorites = JSON.parse(localStorage.getItem('pika-favs')) || [];

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    fetchMedia(currentQuery, true);
    setupFilters();
    attachCategoryListeners();
    setupCookieBanner();
    setupBackToTop();
});

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentOrientation = btn.dataset.orientation;
            page = 1;
            fetchMedia(currentQuery, true);
        });
    });

    const typeBtns = document.querySelectorAll('.type-btn');
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMediaType = btn.dataset.type;
            
            // Update categories based on type
            const categoryNav = document.querySelector('.categories');
            if (currentMediaType === 'videos') {
                categoryNav.innerHTML = `
                    <div class="cat-chip active" data-query="Nature">Nature</div>
                    <div class="cat-chip" data-query="Cinematic">Cinematic</div>
                    <div class="cat-chip" data-query="Time-lapse">Time-lapse</div>
                    <div class="cat-chip" data-query="Technology">Technology</div>
                    <div class="cat-chip" data-query="Aerial">Aerial</div>
                    <div class="cat-chip" data-query="Favorites" id="fav-chip">saved items</div>
                `;
            } else {
                categoryNav.innerHTML = `
                    <div class="cat-chip active" data-query="Nature">Nature</div>
                    <div class="cat-chip" data-query="Architecture">Architecture</div>
                    <div class="cat-chip" data-query="Technology">Technology</div>
                    <div class="cat-chip" data-query="Abstract">Abstract</div>
                    <div class="cat-chip" data-query="Minimal">Minimal</div>
                    <div class="cat-chip" data-query="Favorites" id="fav-chip">saved items</div>
                `;
            }
            
            // Re-attach event listeners to new chips
            attachCategoryListeners();
            
            page = 1;
            fetchMedia(currentQuery, true);
        });
    });
}

function attachCategoryListeners() {
    const newChips = document.querySelectorAll('.cat-chip');
    newChips.forEach(chip => {
        chip.addEventListener('click', () => {
            newChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            searchInput.value = '';
            currentQuery = chip.dataset.query;
            page = 1;
            fetchMedia(currentQuery, true);
        });
    });
}


// Event Listeners
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        currentQuery = query;
        page = 1;
        fetchMedia(currentQuery, true);
        document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            currentQuery = query;
            page = 1;
            fetchMedia(currentQuery, true);
            document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        }
    }
});

// Redundant listener removed as it is now handled by attachCategoryListeners()

// Pagination Element
const paginationContainer = document.getElementById('pagination');
const MAX_PAGES = 40;

async function fetchMedia(query, isNewSearch = false) {
    if (isLoading) return;
    isLoading = true;

    if (isNewSearch) {
        grid.innerHTML = '';
        window.scrollTo(0, 0);
    }

    // Show skeletons
    const loadingSkeletons = [];
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'wall-card skeleton';
        grid.appendChild(skeleton);
        loadingSkeletons.push(skeleton);
    }

    try {
        let results = [];

        // 1. Check for Favorites FIRST
        if (query === 'Favorites') {
            results = favorites;
            loadingSkeletons.forEach(s => s.remove());
            renderMedia(results);
            renderPagination();
            if (results.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 4rem; color:rgba(255,255,255,0.3); font-size: 0.9rem; letter-spacing: 0.1em; text-transform: uppercase;">no items saved yet</div>';
            }
            isLoading = false;
            return;
        }

        // 2. If user has provided a Pexels API Key, use real API
        if (PEXELS_API_KEY && PEXELS_API_KEY !== 'YOUR_API_KEY_HERE') {
            let searchQuery = query;
            let url = '';
            
            if (currentMediaType === 'photos') {
                url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=70&page=${page}&orientation=${currentOrientation}`;
            } else {
                url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchQuery)}&per_page=40&page=${page}&orientation=${currentOrientation}`;
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: PEXELS_API_KEY
                }
            });
            const data = await response.json();
            
            if (currentMediaType === 'photos') {
                results = data.photos.map(photo => ({
                    id: photo.id,
                    type: 'photo',
                    url: photo.src.large2x || photo.src.large,
                    downloadUrl: photo.src.original,
                    sourceUrl: photo.url, 
                    title: photo.alt || `${query} Photo`,
                    source: photo.photographer || 'Pexels'
                }));
            } else {
                results = data.videos.map(video => {
                    const bestFile = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
                    return {
                        id: video.id,
                        type: 'video',
                        url: video.image, // preview image
                        videoUrl: bestFile.link,
                        downloadUrl: bestFile.link,
                        sourceUrl: video.url,
                        title: `Video by ${video.user.name}`,
                        source: video.user.name || 'Pexels',
                        duration: video.duration
                    };
                });
            }
        }

        loadingSkeletons.forEach(s => s.remove());
        renderMedia(results);
        renderPagination();
        isLoading = false;
    } catch (error) {
        console.error("Error fetching media:", error);
        loadingSkeletons.forEach(s => s.remove());
        isLoading = false;
    }
}

function renderPagination() {
    if (currentQuery === 'Favorites') {
        paginationContainer.innerHTML = '';
        return;
    }

    paginationContainer.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 0.3rem; backdrop-filter: blur(20px);';

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = `page-btn ${page === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    prevBtn.onclick = () => changePage(page - 1);
    wrapper.appendChild(prevBtn);

    // Dynamic Range logic
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(MAX_PAGES, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    if (startPage > 1) {
        wrapper.appendChild(createPageBtn(1));
        if (startPage > 2) {
            const dot = document.createElement('span');
            dot.innerText = '...';
            dot.style.cssText = 'color:rgba(255,255,255,0.2); padding: 0 5px;';
            wrapper.appendChild(dot);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        wrapper.appendChild(createPageBtn(i));
    }

    if (endPage < MAX_PAGES) {
        if (endPage < MAX_PAGES - 1) {
            const dot = document.createElement('span');
            dot.innerText = '...';
            dot.style.cssText = 'color:rgba(255,255,255,0.2); padding: 0 5px;';
            wrapper.appendChild(dot);
        }
        wrapper.appendChild(createPageBtn(MAX_PAGES));
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = `page-btn ${page === MAX_PAGES ? 'disabled' : ''}`;
    nextBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
    nextBtn.onclick = () => changePage(page + 1);
    wrapper.appendChild(nextBtn);

    paginationContainer.appendChild(wrapper);
}

function createPageBtn(i) {
    const btn = document.createElement('button');
    btn.className = `page-btn ${i === page ? 'active' : ''}`;
    btn.innerText = i;
    btn.onclick = () => changePage(i);
    return btn;
}

function changePage(newPage) {
    if (newPage >= 1 && newPage <= MAX_PAGES && newPage !== page) {
        page = newPage;
        fetchMedia(currentQuery, true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function getFallbackId(query, index) {
    const genericIds = ['1470770841072-f978cf4d019e', '1441974231531-c6227db76b6e', '1501785888041-af3ef285b470', '1493246507139-91e8bef99c02'];
    const pool = genericIds;
    return pool[index % pool.length];
}

function renderMedia(items) {
    items.forEach((item, index) => {
        const isFav = favorites.some(f => String(f.id) === String(item.id));
        const card = document.createElement('div');
        card.className = 'wall-card';
        card.style.animationDelay = `${index * 0.05}s`;
        
        const heartIcon = isFav ? 
            `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>` : 
            `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

        let mediaContent = `<img src="${item.url}" alt="${item.title}" loading="lazy">`;
        let videoIndicator = '';
        
        if (item.type === 'video') {
            videoIndicator = `
                <div class="video-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    ${item.duration}s
                </div>
                <div class="play-overlay">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </div>
            `;
        }

        card.innerHTML = `
            ${mediaContent}
            ${videoIndicator}
            <a href="${item.sourceUrl}" target="_blank" class="source-tag" onclick="event.stopPropagation();">by ${item.source}</a>
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(event, '${item.id}')">
                ${heartIcon}
            </button>
            <div class="wall-info">
                <span style="font-weight:700; color:white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); font-size:0.8rem;">${item.title}</span>
                <div style="display:flex; gap:0.5rem;">
                    <button class="download-btn" onclick="event.stopPropagation(); downloadImage(this, '${item.downloadUrl || item.url}', '${item.title}')">${item.type === 'video' ? 'GET' : 'DOWN'}</button>
                    <button class="download-btn" style="background:rgba(255,255,255,0.2)">VIEW</button>
                </div>
            </div>
        `;
        
        card.dataset.mediaData = JSON.stringify(item);
        card.addEventListener('click', () => {
            if (item.type === 'video') {
                openVideoModal(item);
            } else {
                openModal(item.url, item.downloadUrl);
            }
        });
        grid.appendChild(card);
    });
}

function handleTilt(e) {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const centerX = box.width / 2;
    const centerY = box.height / 2;
    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
}

function resetTilt(e) {
    e.currentTarget.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
}

function toggleFavorite(event, mediaId) {
    const btn = event.currentTarget;
    const card = btn.closest('.wall-card');
    const mediaData = JSON.parse(card.dataset.mediaData);
    
    const index = favorites.findIndex(f => String(f.id) === String(mediaId));
    if (index === -1) {
        favorites.push(mediaData);
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
        btn.classList.add('active');
    } else {
        favorites.splice(index, 1);
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
        btn.classList.remove('active');
        
        if (currentQuery === 'Favorites') {
            card.style.opacity = '0';
            setTimeout(() => {
                card.remove();
                if (favorites.length === 0) {
                    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 4rem; color:rgba(255,255,255,0.3); font-size: 0.9rem; letter-spacing: 0.1em; text-transform: uppercase;">no items saved yet</div>';
                }
            }, 400);
        }
    }
    
    localStorage.setItem('pika-favs', JSON.stringify(favorites));
}


async function downloadImage(btn, url, filename) {
    const originalText = btn.innerHTML;
    try {
        btn.innerHTML = '...';
        btn.disabled = true;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const blob = await response.blob();
        if (blob.size < 1000) throw new Error('Image too small or protected');

        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = filename + '.jpg';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        
        btn.innerHTML = 'DONE';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Download failed:', error);
        btn.innerHTML = 'PRO/🔒';
        btn.style.background = 'rgba(255,0,0,0.2)';
        btn.title = 'รูปภาพนี้อาจมีการป้องกันลิขสิทธิ์ หรือไม่รองรับการดาวน์โหลดโดยตรง';
        
        // Fallback: Try opening in a new tab if it's just a CORS issue
        setTimeout(() => {
            if(confirm('ไม่สามารถดาวน์โหลดโดยตรงได้ (อาจเป็นรูปภาพ Pro) ต้องการเปิดในหน้าต่างใหม่แทนไหม?')) {
                window.open(url, '_blank');
            }
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 1000);
    }
}



function openModal(url, downloadUrl) {
    modalImg.src = url;
    modalDownload.href = downloadUrl || url;
    modalImg.style.display = 'block';
    
    // Remove video if exists
    const oldVideo = modalFrame.querySelector('video');
    if (oldVideo) oldVideo.remove();

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Add Tilt to Modal Frame
    modalFrame.addEventListener('mousemove', handleTilt);
    modalFrame.addEventListener('mouseleave', resetTilt);
}

function openVideoModal(item) {
    modalImg.style.display = 'none';
    modalDownload.href = item.videoUrl;
    
    // Remove old video
    const oldVideo = modalFrame.querySelector('video');
    if (oldVideo) oldVideo.remove();

    const video = document.createElement('video');
    video.src = item.videoUrl;
    video.controls = true;
    video.autoplay = true;
    video.loop = true;
    video.className = 'modal-content';
    video.style.borderRadius = '18px';
    video.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    modalFrame.appendChild(video);

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

window.onclick = (event) => {
    if (event.target == modal || event.target.className === 'modal-inner') {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// License Modal Logic
const licenseLink = document.getElementById('license-link');
const licenseModal = document.getElementById('license-modal');
const closeLicense = document.querySelector('.close-license');

licenseLink.addEventListener('click', (e) => {
    e.preventDefault();
    licenseModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
});

closeLicense.addEventListener('click', () => {
    licenseModal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

// Lightning Effect
setInterval(() => {
    if (Math.random() > 0.85) {
        const flash = document.createElement('div');
        flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:white;opacity:0.03;pointer-events:none;z-index:9999;';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 40);
    }
}, 4000);

// Cookie Banner Logic
function setupCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('accept-cookies');
    const declineBtn = document.getElementById('decline-cookies');
    const cookieConsent = localStorage.getItem('pika-cookie-consent');

    if (!cookieConsent) {
        setTimeout(() => {
            banner.classList.add('show');
        }, 2000);
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('pika-cookie-consent', 'accepted');
        banner.classList.remove('show');
    });

    declineBtn.addEventListener('click', () => {
        localStorage.setItem('pika-cookie-consent', 'declined');
        banner.classList.remove('show');
    });
}

function setupBackToTop() {
    const btn = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
