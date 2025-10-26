// External JS: gallery interactions, uploads, menu, fullview, and letter compose

// DOM helpers
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// Elements
const gallery = $('.gallery');
const galleryUpload = $('#galleryUpload');
const fab = $('#fab');
const galleryEmptyCTA = $('#gallery-empty-cta');
const ctaUploadBtn = $('#cta-upload-btn');
const composeModal = $('#composeLetter');
const letterTextarea = $('#letterTextarea');
const saveLetterBtn = $('#saveLetter');
const cancelLetterBtn = $('#cancelLetter');
const letterDisplay = $('.letter-display');
const candlesGrid = document.querySelector('#candles .candles-grid');
// Theme toggle
const themeToggleBtn = $('#themeToggle');
const THEME_PREF_KEY = 'eternal_theme';

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    if (themeToggleBtn) {
        themeToggleBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        const icon = themeToggleBtn.querySelector('.theme-icon');
        if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        themeToggleBtn.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_PREF_KEY, next);
    applyTheme(next);
}

// candles storage and sorting
let candlesSort = 'recent';

// load and render candles from remembered person
async function loadCandles() {
    try {
        const remembered = currentRemembered;
        if (!remembered) return;
        const response = await fetch(`${API_BASE_URL}/remembered/${remembered.id}`);
        if (!response.ok) throw new Error('Failed to fetch remembered person');
        const profile = await response.json();
        const candles = profile.candles || [];
        renderCandles(candles);
    } catch (error) {
        console.error('Error loading candles:', error);
        alert('Failed to load candles');
    }
}

async function addOrIncrementCandle(visitorName) {
    try {
        const remembered = currentRemembered;
        if (!remembered) throw new Error('No profile selected');
        const response = await fetch(`${API_BASE_URL}/remembered/${remembered.id}/candles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitorName })
        });
        
        if (!response.ok) throw new Error('Failed to light candle');
        await loadCandles(); // Reload candles after adding
    } catch (error) {
        console.error('Error lighting candle:', error);
        alert('Failed to light candle');
    }
}

function renderCandles(candles) {
    if (!candlesGrid) return;
    candlesGrid.innerHTML = '';
    if (!candles || !candles.length) {
        candlesGrid.innerHTML = '<div class="no-candles">No candles lit yet. Use the + button to light one.</div>';
        return;
    }
    // apply sort
    const items = candles.slice();
    if (candlesSort === 'highest') {
        items.sort((a,b) => (b.count||0) - (a.count||0));
    } else {
        // Sort by most recent timestamp in the timeStamps array
        items.sort((a,b) => {
            const aTime = a.timeStamps ? a.timeStamps[a.timeStamps.length - 1] : '';
            const bTime = b.timeStamps ? b.timeStamps[b.timeStamps.length - 1] : '';
            return new Date(bTime) - new Date(aTime);
        });
    }
    // totals
    const totalParticipants = items.length;
    const totalLit = items.reduce((s,i) => s + (i.count||0), 0);
    const totalEl = document.getElementById('total-candles');
    const participantsEl = document.getElementById('total-participants');
    if (totalEl) totalEl.textContent = `Total lit: ${totalLit}`;
    if (participantsEl) participantsEl.textContent = `Participants: ${totalParticipants}`;
    items.forEach(c => {
        const el = document.createElement('div');
        el.className = 'candle-card';
        const lastTimestamp = c.timeStamps ? c.timeStamps[c.timeStamps.length - 1] : '';
        el.innerHTML = `<div class="candle-content"><div class="candle-name">${escapeHtml(c.name)}</div><div class="candle-ts">${new Date(lastTimestamp).toLocaleString()}</div></div><div class="candle-count">×${c.count || 0}</div>`;
        candlesGrid.appendChild(el);
    });
}

function lightCandleFlow() {
    const defaultName = document.querySelector('.name')?.textContent?.trim() || 'You';
    const name = prompt('Enter a name for the candle (who is lighting it):', defaultName);
    if (!name) return;
    addOrIncrementCandle(name.trim());
}

// sort control wiring
const candlesSortSelect = $('#candles-sort');
if (candlesSortSelect) {
    candlesSortSelect.addEventListener('change', (e) => {
        candlesSort = e.target.value || 'recent';
        // re-fetch and render with new sort
        loadCandles();
    });
}

// --- Letter handling using remembered_persons endpoints ---
async function loadLetter() {
    try {
        const remembered = currentRemembered;
        if (!remembered) return;
        
        const response = await fetch(`${API_BASE_URL}/remembered/${remembered.id}`);
        if (!response.ok) throw new Error('Failed to fetch profile');
        const profile = await response.json();
        const letters = profile.letters || [];
        
        // Calculate statistics
        const totalLetters = letters.length;
        const uniqueSenders = new Set(letters.map(l => l.sender)).size;
        const statsHtml = totalLetters > 0 ? `
            <div class="letters-stats">
                <div><span>${totalLetters}</span> letters written</div>
                <div><span>${uniqueSenders}</span> heartfelt senders</div>
            </div>
        ` : '';
        
        if (!letters.length) {
            letterDisplay.innerHTML = '<p class="muted">No letters yet — click the + button while on "Letter to Her" to write one.</p>';
            return;
        }

        // render stats and list of letters
        letterDisplay.innerHTML = statsHtml;
        letters.forEach(letter => {
            const el = document.createElement('div');
            el.className = 'letter-paper';
            el.innerHTML = `
                <button class="letter-report" title="Report letter">Report</button>
                <div class="letter-body">${escapeHtml(letter.content).replace(/\n/g, '<br>')}</div>
                <div class="letter-signature">— ${escapeHtml(letter.sender)}, ${new Date(letter.timeStamp).toLocaleDateString()}</div>
            `;
            // wire report button
            el.querySelector('.letter-report').addEventListener('click', () => {
                if (confirm('Report this letter?')) alert('Letter reported. Thank you.');
            });
            letterDisplay.appendChild(el);
        });
    } catch (error) {
        console.error('Error loading letters:', error);
        alert('Failed to load letters');
    }
}

async function saveLetterObj(obj) {
    try {
        const remembered = currentRemembered;
        if (!remembered) throw new Error('No profile selected');
        
        const response = await fetch(`${API_BASE_URL}/remembered/${remembered.id}/letters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: obj.body,
                sender: currentUser.name
            })
        });
        
        if (!response.ok) throw new Error('Failed to save letter');
        await loadLetter(); // Reload letters after saving
    } catch (error) {
        console.error('Error saving letter:', error);
        alert('Failed to save letter');
    }
}

// --- FAB behavior ---
function updateFabBehavior(activeTab) {
    if (activeTab === 'memories') {
        fab.title = 'Upload memories';
        fab.onclick = () => galleryUpload.click();
        fab.querySelector('.fab-icon').textContent = '+';
    } else if (activeTab === 'letter') {
        fab.title = 'Write letter';
        fab.onclick = () => openComposeModal();
        fab.querySelector('.fab-icon').textContent = '✎';
    } else if (activeTab === 'candles') {
        fab.title = 'Light a candle';
        fab.onclick = () => lightCandleFlow();
        fab.querySelector('.fab-icon').textContent = '🕯';
    }
}

// Setup tab switching (delegated)
$('.mainNav').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    $$('.tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    tab.classList.add('active'); tab.setAttribute('aria-selected','true');
    const targetId = tab.dataset.tab;
    $$('.tabPanel').forEach(p => { const isTarget = p.id === targetId; p.classList.toggle('hidden', !isTarget); p.setAttribute('aria-hidden', !isTarget); });
    updateFabBehavior(targetId);
    // if entering letter tab, ensure letter displayed
    if (targetId === 'letter') loadLetter();
    if (targetId === 'candles') loadCandles();
});

// --- Blob shape generation ---
function generateBlobPath() {
    const numPoints = 7;
    const radius = 38;
    const variance = 18;
    const cx = 50, cy = 50;
    let d = '';
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const r = radius + (Math.random() * variance - variance / 2);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const nextAngle = ((i + 1) / numPoints) * Math.PI * 2;
        const nr = radius + (Math.random() * variance - variance / 2);
        const nx = cx + Math.cos(nextAngle) * nr;
        const ny = cy + Math.sin(nextAngle) * nr;
        const mx = (x + nx) / 2;
        const my = (y + ny) / 2;
        if (i === 0) d += `M ${x},${y}`;
        d += ` Q ${mx},${my} ${nx},${ny}`;
    }
    return d + ' Z';
}

// --- Upload handling (no backend) ---
galleryUpload.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const div = document.createElement('div'); div.className = 'gallery-item';
            // attach basic metadata to dataset for details modal
            div.dataset.filename = file.name;
            div.dataset.size = file.size;
            div.dataset.uploaded = new Date().toISOString();
            div.dataset.title = file.name;

            // decorative SVG shape (no clipping of the image)
            const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
            svg.setAttribute('viewBox','0 0 100 100');
            svg.innerHTML = `<path class="shape" d="${generateBlobPath()}" />`;
            const img = document.createElement('img'); img.src = ev.target.result; img.alt = file.name; img.className = 'gallery-img';
            // menu (transparent by design)
            const menu = document.createElement('div'); menu.className = 'menu';
            menu.innerHTML = `<button class="menu-button" aria-haspopup="true" aria-expanded="false" aria-label="More options"><svg width="16" height="16"><use href="#icon-more"/></svg></button><ul class="dropdown-menu" role="menu" hidden><li role="none"><button role="menuitem" class="dropdown-item" data-action="details">Details</button></li><li role="none"><button role="menuitem" class="dropdown-item" data-action="report">Report</button></li></ul>`;
            // bottom metadata overlay (visible)
            const label = document.createElement('div'); label.className = 'metadata-overlay'; label.innerHTML = `<span class="by-line">By You</span>`;

            // show image directly, with decorative svg behind
            div.appendChild(svg);
            div.appendChild(img);
            div.appendChild(menu);
            div.appendChild(label);
            gallery.appendChild(div);
            // update CTA visibility immediately after adding each image
            updateGalleryCTA();
        };
        reader.readAsDataURL(file);
    });
    e.target.value = '';
});

// show/hide the empty gallery CTA depending on whether there are gallery items
function updateGalleryCTA() {
    // Ensure we wait for next tick so DOM is updated
    setTimeout(() => {
        if (!galleryEmptyCTA) return;
        const items = gallery.querySelectorAll('.gallery-item');
        const hasItems = items && items.length > 0;
        if (hasItems) galleryEmptyCTA.setAttribute('hidden',''); else galleryEmptyCTA.removeAttribute('hidden');
    }, 0);
}

// wire the CTA button to open the file picker
if (ctaUploadBtn) {
    ctaUploadBtn.addEventListener('click', (e) => { e.preventDefault(); galleryUpload.click(); });
}

// --- Fullview modal ---
const fullview = document.createElement('div'); fullview.id = 'fullview'; fullview.className = 'fullview-overlay'; fullview.setAttribute('role','dialog'); fullview.setAttribute('aria-hidden','true');
fullview.innerHTML = `
    <button id="fullview-close" class="menu-button" aria-label="Close full view">✕</button>
    <div class="fullview-inner"><img id="fullview-img" alt="" style="max-width:90%;max-height:80%;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,0.6);" /><div class="fullview-meta" style="color:#fff;margin-top:18px;max-width:900px;text-align:left"></div></div>`;
document.body.appendChild(fullview);

function openFullview(src, info) {
    const fv = $('#fullview'); const img = fv.querySelector('#fullview-img'); const meta = fv.querySelector('.fullview-meta');
    if (src) img.src = src; else img.removeAttribute('src');
    meta.innerHTML = `<h3 style="margin:0 0 8px;">${escapeHtml(info.title || '')}</h3><div>${escapeHtml(info.meta || '')}</div>`;
    fv.style.display = 'flex'; fv.setAttribute('aria-hidden','false'); fv.querySelector('#fullview-close').focus();
}
function closeFullview() { const fv = $('#fullview'); fv.style.display = 'none'; fv.setAttribute('aria-hidden','true'); }

document.addEventListener('click', (e) => {
    // menu button toggle
    const mb = e.target.closest('.menu-button');
    if (mb && mb.closest('.menu')) {
        e.stopPropagation();
        const menu = mb.parentElement.querySelector('.dropdown-menu');
        const expanded = mb.getAttribute('aria-expanded') === 'true';
        $$('.dropdown-menu').forEach(m => m.setAttribute('hidden',''));
        $$('.menu-button').forEach(b => b.setAttribute('aria-expanded','false'));
        if (!expanded) { menu.removeAttribute('hidden'); mb.setAttribute('aria-expanded','true'); }
        return;
    }

    // dropdown item actions
    const actionBtn = e.target.closest('.dropdown-item');
    if (actionBtn) {
        const action = actionBtn.dataset.action; const item = actionBtn.closest('.gallery-item');
        if (action === 'details') {
            // use dataset metadata when available
            const info = {
                title: item.dataset.title || item.querySelector('.placeholder-content')?.textContent || '',
                filename: item.dataset.filename || '',
                size: item.dataset.size || '',
                uploaded: item.dataset.uploaded || ''
            };
            openDetailsModal(info);
        } else if (action === 'report') {
            const name = item.dataset.filename || item.querySelector('.placeholder-content')?.textContent || 'this item';
            if (confirm(`Report ${name}?`)) alert('Reported. Thank you.');
        }
        $$('.dropdown-menu').forEach(m => m.setAttribute('hidden',''));
        $$('.menu-button').forEach(b => b.setAttribute('aria-expanded','false'));
        return;
    }

    // close menus when clicking outside
    if (!e.target.closest('.menu')) { $$('.dropdown-menu').forEach(m => m.setAttribute('hidden','')); $$('.menu-button').forEach(b => b.setAttribute('aria-expanded','false')); }

    // open fullview when clicking an item (not menu)
    const item = e.target.closest('.gallery-item');
    if (item && !e.target.closest('.menu')) {
        const img = item.querySelector('img'); const src = img ? img.src : null; const title = item.querySelector('.placeholder-content')?.textContent || '';
        const meta = item.querySelector('.by-line')?.textContent || '';
        openFullview(src, { title, meta });
    }
});

document.addEventListener('click', (e) => { if (e.target.id === 'fullview-close') closeFullview(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFullview(); });

function escapeHtml(str){ return String(str).replace(/[&<>\"]/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]||s)); }

// --- Compose letter modal ---
function openComposeModal() { composeModal.classList.remove('hidden'); composeModal.setAttribute('aria-hidden','false'); letterTextarea.focus(); }
function closeComposeModal() { composeModal.classList.add('hidden'); composeModal.setAttribute('aria-hidden','true'); }

// Confirm before saving: irreversible
saveLetterBtn.addEventListener('click', () => {
    const raw = letterTextarea.value || '';
    if (!raw.trim()) { alert('Cannot save an empty letter.'); return; }
    // build signed text with name and date
    const signer = document.querySelector('.name')?.textContent?.trim() || 'You';
    const dateStr = new Date().toLocaleDateString();
    const signed = `${raw}\n\n— ${signer}, ${dateStr}`;
    if (confirm('Posting this letter is irreversible. Do you want to post it?')) {
        // append to letters array
        saveLetterObj({ body: raw, signer, date: dateStr });
        // clear textarea for next letter
        letterTextarea.value = '';
        closeComposeModal();
    }
});
cancelLetterBtn.addEventListener('click', () => { closeComposeModal(); });

// Search functionality with API readiness
const searchToggle = document.querySelector('.search-toggle');
const searchContainer = document.querySelector('.search-input-container');
const searchInput = document.querySelector('.search-input');
const searchClear = document.querySelector('.search-clear');

// Debounce helper for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// API endpoint configurations (for future implementation)
const API_CONFIG = {
    baseUrl: '/api/v1', // Replace with actual API base URL
    endpoints: {
        search: '/search',
        memories: '/memories',
        letters: '/letters',
        candles: '/candles'
    }
};

/**
 * Search API integration (ready for future backend)
 * Expected API Response format:
 * {
 *   results: [{
 *     id: string,
 *     type: 'memory'|'letter'|'candle',
 *     title: string,
 *     preview: string,
 *     timestamp: string,
 *     author: string
 *   }],
 *   metadata: {
 *     total: number,
 *     page: number
 *   }
 * }
 */
// Remote search helper (calls backend)
async function remoteSearch(query) {
    if (!query) return [];
    try {
        const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error('remoteSearch error', err);
        return [];
    }
}

function renderSearchOverlay(results, query) {
    let overlay = document.getElementById('searchOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'searchOverlay';
        overlay.className = 'search-overlay';
        overlay.innerHTML = `<div class="search-panel"><button id="searchClose" class="btn">Close</button><div id="searchResults"></div></div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('#searchClose').addEventListener('click', () => overlay.remove());
        // basic styles to avoid stylesheet edits
        const style = document.createElement('style');
        style.textContent = `#searchOverlay{position:fixed;inset:0;display:flex;align-items:flex-start;justify-content:center;padding:48px;z-index:1600} #searchOverlay .search-panel{background:var(--card);padding:18px;border-radius:12px;max-width:900px;width:100%;box-shadow:var(--shadow);overflow:auto;max-height:80vh} .search-item{display:flex;gap:12px;padding:8px;border-bottom:1px solid rgba(0,0,0,0.04)} .search-thumb img{width:80px;height:64px;object-fit:cover;border-radius:8px} .search-meta p{margin:6px 0;color:var(--muted)}`;
        document.head.appendChild(style);
    }

    const container = overlay.querySelector('#searchResults');
    container.innerHTML = '';
    if (!results || results.length === 0) {
        container.innerHTML = `<div class="no-results">No results for "${escapeHtml(query)}"</div>`;
        return;
    }

    results.forEach(item => {
        const el = document.createElement('div');
        el.className = 'search-item';
        if (item.type === 'memory') {
            el.innerHTML = `<div class="search-thumb"><img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.title||'memory')}"/></div><div class="search-meta"><strong>${escapeHtml(item.title||'Untitled')}</strong><div class="muted">${escapeHtml(item.user_name||'')}</div></div>`;
            el.addEventListener('click', () => openFullview(item.url, { title: item.title, meta: item.user_name }));
        } else if (item.type === 'letter') {
            el.innerHTML = `<div class="search-meta"><strong>Letter</strong><div class="muted">${escapeHtml(item.user_name||'')}</div><p>${escapeHtml(item.title||'').slice(0,200)}</p></div>`;
        } else if (item.type === 'candle') {
            el.innerHTML = `<div class="search-meta"><strong>Candle by ${escapeHtml(item.title||'')}</strong><div class="muted">Count: ${escapeHtml(item.url||'0')}</div></div>`;
        } else {
            el.textContent = JSON.stringify(item);
        }
        container.appendChild(el);
    });
}

// Search API uses remote then local fallback
async function searchAPI(query, options = {}) {
    if (!query) return { results: [], metadata: { total: 0, page: 1 } };
    const remote = await remoteSearch(query);
    if (remote && Array.isArray(remote) && remote.length) {
        return { results: remote, metadata: { total: remote.length, page: 1 } };
    }

    /*local fallback
    const results = [];
    const memoryItems = Array.from(document.querySelectorAll('.gallery-item')).map(item => ({
        type: 'memory',
        title: item.dataset.title || '',
        author: item.querySelector('.by-line')?.textContent || ''
    }));
    const letters = JSON.parse(localStorage.getItem(LETTERS_KEY) || '[]');
    const candles = JSON.parse(localStorage.getItem(CANDLES_KEY) || '[]');
    const searchTerm = query.toLowerCase();
    results.push(...memoryItems.filter(item => item.title.toLowerCase().includes(searchTerm) || item.author.toLowerCase().includes(searchTerm)));
    results.push(...letters.filter(letter => letter.body.toLowerCase().includes(searchTerm) || letter.signer.toLowerCase().includes(searchTerm)).map(l => ({ type: 'letter', title: `Letter from ${l.signer}`, preview: l.body.slice(0, 100) })));
    results.push(...candles.filter(candle => candle.name.toLowerCase().includes(searchTerm)).map(c => ({ type: 'candle', title: c.name, timestamp: c.ts })));
    return { results, metadata: { total: results.length, page: 1 } };*/
}

// Search input handler with debounce
const handleSearch = debounce(async (query) => {
    if (!query) {
        searchClear.hidden = true;
        return;
    }
    searchClear.hidden = false;
    try {
        const response = await searchAPI(query);
        const results = response.results || response;
        console.log(results)
        renderSearchOverlay(results, query);
    } catch (error) {
        console.error('Search failed:', error);
    }
}, 300);

// Toggle search visibility
if (searchToggle && searchContainer && searchInput) {
    searchToggle.addEventListener('click', () => {
        const isExpanded = searchToggle.getAttribute('aria-expanded') === 'true';
        searchToggle.setAttribute('aria-expanded', !isExpanded);
        searchContainer.toggleAttribute('data-active');
        searchContainer.hidden = isExpanded;
        if (!isExpanded) {
            searchInput.focus();
        }
    });

    // Handle clicks outside to close
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container') && searchContainer.hasAttribute('data-active')) {
            searchToggle.setAttribute('aria-expanded', 'false');
            searchContainer.removeAttribute('data-active');
            searchContainer.hidden = true;
            searchInput.value = '';
            searchClear.hidden = true;
        }
    });

    // Wire up search input
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    
    // Wire up clear button
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.focus();
            searchClear.hidden = true;
            handleSearch('');
        });
    }
}

// API configuration
const API_BASE_URL = 'http://localhost:3000/api';

// User and profile management
let currentUser = null;
let currentRemembered = null;

// Remembered person's name (would typically come from server configuration)
const REMEMBERED_NAME = 'Loved One';
const REMEMBERED_DATES = 'January 1, 1950 — December 31, 2020';
const REMEMBERED_REMARK = 'A short loving remark or memory goes here — replace with text you prefer.';

async function getCurrentUser() {
    const visitorName = localStorage.getItem('visitorName');
    if (!visitorName) return null;
    return { name: visitorName };
}

async function promptForName() {
    // First check localStorage
    let name = localStorage.getItem('visitorName');
    
    // If no name in localStorage, prompt user
    if (!name) {
        name = prompt('Please enter your name to continue:');
        if (!name) return null;
        
        // Save to localStorage (only store we keep)
        localStorage.setItem('visitorName', name);
    }
    
    return { name };
}

// Modified gallery upload to use Imgur via backend
async function uploadMemory(file) {
    try {
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
        
        if (base64.length > 10000000) { // 10MB limit
            throw new Error('Image too large. Please choose a smaller image (under 10MB).');
        }

        const response = await fetch(`${API_BASE_URL}/memories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: file.name,
                image: base64,
                userId: currentUser.id
            })
        });
        
        if (!response.ok) throw new Error('Failed to upload memory');
        return await response.json();
    } catch (error) {
        console.error('Error uploading memory:', error);
        alert(error.message || 'Failed to upload memory');
        return null;
    }
}

// Modified gallery render
async function loadMemories() {
    try {
        const response = await fetch(`${API_BASE_URL}/memories`);
        if (!response.ok) throw new Error('Failed to fetch memories');
        
        const memories = await response.json();
        gallery.innerHTML = ''; // Clear existing
        
        memories.forEach(memory => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.dataset.id = memory.id;
            div.dataset.title = memory.title;
            div.dataset.uploaded = memory.created_at;
            
            // Create gallery item HTML
            const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
            svg.setAttribute('viewBox','0 0 100 100');
            svg.innerHTML = `<path class="shape" d="${generateBlobPath()}" />`;
            
            const img = document.createElement('img');
            img.src = memory.image_url;
            img.alt = memory.title;
            img.className = 'gallery-img';
            
            const menu = document.createElement('div');
            menu.className = 'menu';
            menu.innerHTML = `<button class="menu-button" aria-haspopup="true" aria-expanded="false" aria-label="More options"><svg width="16" height="16"><use href="#icon-more"/></svg></button><ul class="dropdown-menu" role="menu" hidden><li role="none"><button role="menuitem" class="dropdown-item" data-action="details">Details</button></li></ul>`;
            
            const label = document.createElement('div');
            label.className = 'metadata-overlay';
            label.innerHTML = `<span class="by-line">By ${memory.user_name}</span>`;
            
            div.appendChild(svg);
            div.appendChild(img);
            div.appendChild(menu);
            div.appendChild(label);
            gallery.appendChild(div);
        });
        
        updateGalleryCTA();
    } catch (error) {
        console.error('Error loading memories:', error);
        alert('Failed to load memories');
    }
}

// Modified file upload handler
galleryUpload.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        await uploadMemory(file);
    }
    
    e.target.value = '';
    await loadMemories(); // Reload gallery after uploads
});

// Load remembered person profile
async function loadRememberedProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/remembered`);
        if (!response.ok) throw new Error('Failed to fetch profiles');
        const profiles = await response.json();
        if (profiles && profiles.length > 0) {
            currentRemembered = profiles[0]; // Load first profile for now
            
            // Update UI with profile
            document.querySelector('.name').textContent = currentRemembered.name;
            document.querySelector('.remark').textContent = currentRemembered.remark || '';
            const bday = currentRemembered.birthday ? new Date(currentRemembered.birthday).toLocaleDateString() : '';
            const lday = currentRemembered.lastday ? new Date(currentRemembered.lastday).toLocaleDateString() : '';
            document.querySelector('.lifedates').textContent = `${bday} — ${lday}`;
            
            // Load data for current profile
            await Promise.all([
                loadMemories(),
                loadLetter(),
                loadCandles()
            ]);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Failed to load profile');
    }
}

// Initialize app
async function initializeApp() {
    // Get visitor name from localStorage or prompt
    currentUser = await getCurrentUser();
    if (!currentUser) {
        currentUser = await promptForName();
        if (!currentUser) {
            alert('Name is required to use this application.');
            return;
        }
    }
    
    // Load profile and initialize UI
    updateFabBehavior('memories');
    await loadRememberedProfile();
}

// initialize theme from preference, fall back to OS preference if unset
try {
    const savedTheme = localStorage.getItem(THEME_PREF_KEY);
    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    } else {
        applyTheme('light');
    }
} catch (err) {
    // ignore storage errors
    applyTheme('light');
}

if (themeToggleBtn) themeToggleBtn.addEventListener('click', () => toggleTheme());

// Start the application
initializeApp().catch(console.error);

// --- Details modal (for Details action) ---
function createDetailsModal() {
    if ($('#detailsModal')) return;
    const modal = document.createElement('div'); modal.id = 'detailsModal'; modal.className = 'fullview-overlay'; modal.setAttribute('role','dialog'); modal.setAttribute('aria-hidden','true');
    modal.innerHTML = `
        <div class="details-paper">
            <div class="details-header">
                <h3 id="details-title">Details</h3>
                <div>
                    <button class="collapse-toggle" title="Collapse">Toggle</button>
                    <button id="details-close" class="menu-button" aria-label="Close details">✕</button>
                </div>
            </div>
            <div class="details-body">
                <div id="details-list"></div>
            </div>
            <div class="details-footer">
                <div></div>
                <button class="report-button">Report</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // wire one-time listeners for collapse and report
    const collapseBtn = modal.querySelector('.collapse-toggle');
    const reportBtn = modal.querySelector('.report-button');
    collapseBtn.addEventListener('click', () => {
        modal.classList.toggle('collapsed');
    });
    reportBtn.addEventListener('click', () => {
        if (confirm('Report this item?')) alert('Reported. Thank you.');
    });
}

function openDetailsModal(info) {
    createDetailsModal();
    const modal = $('#detailsModal');
    modal.querySelector('#details-title').textContent = info.title || 'Details';
    const dl = modal.querySelector('#details-list');
    const sizeStr = info.size ? formatBytes(Number(info.size)) : '';
    dl.innerHTML = `
        <div><strong>Filename:</strong> ${escapeHtml(info.filename || '-')}</div>
        <div><strong>Uploaded:</strong> ${escapeHtml(info.uploaded ? new Date(info.uploaded).toLocaleString() : '-')}</div>
        <div><strong>Size:</strong> ${escapeHtml(sizeStr || '-')}</div>
    `;
    modal.style.display = 'flex'; modal.setAttribute('aria-hidden','false');

    // collapse/report handlers attached once during creation
}

function closeDetailsModal() { const m = $('#detailsModal'); if (m) { m.style.display='none'; m.setAttribute('aria-hidden','true'); m.classList.remove('collapsed'); } }

document.addEventListener('click', (e) => { if (e.target.id === 'details-close') closeDetailsModal(); });

function formatBytes(bytes, decimals = 1) {
    if (!bytes) return '0 B';
    const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['B','KB','MB','GB','TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
