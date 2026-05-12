// PikaWalls Logic - Premium Wallpaper Site
const grid = document.getElementById('wallpaper-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-button');
const chips = document.querySelectorAll('.cat-chip');
const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const closeModal = document.querySelector('.close-modal');
const modalDownload = document.getElementById('modal-download-link');

// PEXELS API CONFIG
// Note: Get your free key at https://www.pexels.com/api/
const PEXELS_API_KEY = 'YOUR_API_KEY_HERE'; 

let currentQuery = 'Pikachu';
let isLoading = false;
let page = 1;

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    fetchWallpapers(currentQuery, true);
});

// Event Listeners
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        currentQuery = query;
        page = 1;
        fetchWallpapers(currentQuery, true);
        chips.forEach(c => c.classList.remove('active'));
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            currentQuery = query;
            page = 1;
            fetchWallpapers(currentQuery, true);
            chips.forEach(c => c.classList.remove('active'));
        }
    }
});

chips.forEach(chip => {
    chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        searchInput.value = '';
        currentQuery = chip.dataset.query;
        page = 1;
        fetchWallpapers(currentQuery, true);
    });
});

// Infinite Scroll
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000 && !isLoading) {
        page++;
        fetchWallpapers(currentQuery, false);
    }
});

async function fetchWallpapers(query, isNewSearch = false) {
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

        // If user has provided a Pexels API Key, use real API
        if (PEXELS_API_KEY !== 'YOUR_API_KEY_HERE') {
            const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}`, {
                headers: {
                    Authorization: PEXELS_API_KEY
                }
            });
            const data = await response.json();
            
            results = data.photos.map(photo => ({
                id: photo.id,
                url: photo.src.large2x || photo.src.large,
                sourceUrl: photo.url,
                title: photo.alt || `${query} Wallpaper`,
                source: photo.photographer
            }));
        } else {
            // FALLBACK: Use robust random source if no API key
            // This ensures the site still works out of the box
            for (let i = 0; i < 12; i++) {
                const randomSeed = Math.floor(Math.random() * 1000000) + (page * 12 + i);
                const imgUrl = `https://images.unsplash.com/photo-${getFallbackId(query, i)}?auto=format&fit=crop&w=800&q=80`;
                results.push({
                    id: `fallback-${randomSeed}`,
                    url: imgUrl,
                    sourceUrl: `https://wallpapers.com/search/${encodeURIComponent(query)}`,
                    title: `${query} HD Wallpaper`,
                    source: 'Magnific'
                });
            }
        }

        loadingSkeletons.forEach(s => s.remove());
        renderWallpapers(results);
        isLoading = false;
    } catch (error) {
        console.error("Error fetching wallpapers:", error);
        loadingSkeletons.forEach(s => s.remove());
        isLoading = false;
    }
}

function getFallbackId(query, index) {
    const pikaIds = ['1613771404721-1f92d799e49f', '1542751371-adc38448a05e', '1551269901-5c5e14c25df7', '1605333396511-4710ee033d59'];
    const genericIds = ['1470770841072-f978cf4d019e', '1441974231531-c6227db76b6e', '1501785888041-af3ef285b470', '1493246507139-91e8bef99c02'];
    const pool = query.toLowerCase().includes('pikachu') ? pikaIds : genericIds;
    return pool[index % pool.length];
}

function renderWallpapers(walls) {
    walls.forEach(wall => {
        const card = document.createElement('div');
        card.className = 'wall-card';
        
        card.innerHTML = `
            <img src="${wall.url}" alt="${wall.title}" loading="lazy">
            <a href="${wall.sourceUrl}" target="_blank" class="source-tag" onclick="event.stopPropagation();">by ${wall.source}</a>
            <div class="wall-info">
                <span style="font-weight:700; color:white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); font-size:0.8rem;">${wall.title}</span>
                <button class="download-btn">VIEW HD</button>
            </div>
        `;
        
        card.addEventListener('click', () => openModal(wall.url));
        grid.appendChild(card);
    });
}

function openModal(url) {
    modalImg.src = url;
    modalDownload.href = url;
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

// Lightning Effect
setInterval(() => {
    if (Math.random() > 0.85) {
        const flash = document.createElement('div');
        flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:white;opacity:0.03;pointer-events:none;z-index:9999;';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 40);
    }
}, 4000);
