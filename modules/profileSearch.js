// Profile search module
// Wires the header .search-input to search memorial profiles and render matching profiles

const $ = (sel) => document.querySelector(sel);

function debounce(fn, wait = 250) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

let cachedProfiles = null;
const backend = window.BACKEND_ORIGIN || 'http://localhost:3000';

async function fetchProfiles() {
  if (cachedProfiles) return cachedProfiles;
  try {
    const res = await fetch(`${backend}/api/memorial_profiles/recent`);
    if (!res.ok) throw new Error('Failed to fetch profiles');
    cachedProfiles = await res.json();
    return cachedProfiles;
  } catch (e) {
    console.warn('fetchProfiles fallback', e);
    // fallback minimal sample
    cachedProfiles = [ { id: 'john_doe_5', name: 'John Doe', profilePic: 'https://via.placeholder.com/150' } ];
    return cachedProfiles;
  }
}

async function doSearch(q) {
  const query = (q || '').trim().toLowerCase();
  if (!query) return [];

  // Try server search endpoint first
  try {
    const res = await fetch(`${backend}/api/memorial_profiles/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length) return json;
    }
  } catch (e) {
    // ignore, we'll fallback to local filter
  }

  // Local filter fallback
  const list = await fetchProfiles();
  return list.filter(p => (p.name || '').toLowerCase().includes(query));
}

function renderResults(results) {
  // When search results should show profiles, navigate to profiles main and render list
  try {
    const renderModule = import('./render.js');
    renderModule.then(mod => {
      if (!results || results.length === 0) {
        // If no results, we can optionally show no-results state
        history.pushState({}, '', '/memorial_profiles');
        document.dispatchEvent(new CustomEvent('route:changed', { detail: { path: window.location.pathname } }));
        mod.renderMemorialProfilesList([]);
        return;
      }
      // show profiles main and render
      history.pushState({}, '', '/memorial_profiles');
      document.dispatchEvent(new CustomEvent('route:changed', { detail: { path: window.location.pathname } }));
      mod.renderMemorialProfilesList(results);
    });
  } catch (e) {
    console.error('renderResults error', e);
  }
}

// Wire UI
function initProfileSearch() {
  const input = $('.search-input');
  if (!input) return;
  const handler = debounce(async (val) => {
    const q = val.trim();
    if (!q) return; // keep existing view when empty
    const results = await doSearch(q);
    renderResults(results);
  }, 300);

  input.addEventListener('input', (e) => handler(e.target.value));

  // wire clear button
  const clear = document.querySelector('.search-clear');
  if (clear) {
    clear.addEventListener('click', () => {
      const inp = document.querySelector('.search-input');
      if (inp) inp.value = '';
      history.pushState({}, '', '/memorial_profiles');
      document.dispatchEvent(new CustomEvent('route:changed', { detail: { path: window.location.pathname } }));
    });
  }
}

// initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProfileSearch);
} else {
  initProfileSearch();
}

export {};
