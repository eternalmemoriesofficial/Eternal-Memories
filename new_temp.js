import { renderMemorialPage, renderMemorialProfilesList } from "./modules/render.js";

const backendOrigin = "http://localhost:3000";
window.BACKEND_ORIGIN = backendOrigin;

function showMain(name) {
  const mains = document.querySelectorAll('main.container');
  mains.forEach(m => m.classList.add('hidden'));
  if (name === 'memorialPage') {
    const mp = document.querySelector('main.memorialPage'); if (mp) mp.classList.remove('hidden');
  } else if (name === 'memorialProfiles') {
    const mp = document.querySelector('main.memorialProfiles'); if (mp) mp.classList.remove('hidden');
  }
}

async function loadProfilesAndShow() {
  showMain('memorialProfiles');
  try {
    const res = await fetch(`${backendOrigin}/api/memorial_profiles/recent`);
    if (!res.ok) throw new Error('Failed to fetch recent profiles');
    const list = await res.json();
    renderMemorialProfilesList(list);
  } catch (e) {
    console.error(e);
    // fallback static sample
    renderMemorialProfilesList([
      { id: 'john_doe_5', name: 'John Doe', profilePic: 'https://via.placeholder.com/150' }
    ]);
  }
}

async function loadMemorialPageAndShow(id) {
  showMain('memorialPage');
  try {
    const res = await fetch(`${backendOrigin}/api/memorial_profiles/${id}`);
    if (!res.ok) throw new Error('Failed to fetch memorial profile');
    const profile = await res.json();
    renderMemorialPage(profile);
  } catch (e) {
    console.error(e);
    // fallback mock
    renderMemorialPage({
      id,
      name: 'John Doe',
      birthdate: '1950-10-27',
      lastday: '2020-12-31',
      profilePic: '../PlayerFilled.png',
      coverPhoto: "../birthday-party-banner-with-pink-balloon-confetti.jpg",
      remark: 'A beloved member of the community.',
      memories: [{ id: 1, title: 'Graduation Day', imageUrl: 'https://via.placeholder.com/300', createdAt: '2021-01-01', uploadedBy: 'Alice' }],
      candles: [{ name: 'Visitor1', count: 5, timeStamps: [] }],
      letters: [{ content: 'You are missed dearly.', sender: 'Bob', timeStamp: '2021-02-01' }]
    });
  }
}

function handleRoute(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'memorial_page' && parts[1]) {
    loadMemorialPageAndShow(parts[1]);
  } else if (!parts.length || parts[0] === 'memorial_profiles') {
    loadProfilesAndShow();
  } else {
    // unknown route -> show profiles as default
    loadProfilesAndShow();
  }
}

document.addEventListener('DOMContentLoaded', () => handleRoute(window.location.pathname));

// react to history navigation or programmatic route change
window.addEventListener('popstate', () => handleRoute(window.location.pathname));
document.addEventListener('route:changed', (e) => handleRoute(window.location.pathname));
