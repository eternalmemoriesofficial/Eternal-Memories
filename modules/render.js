// DOM helpers
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// auto-init UI controls when a memorial is rendered
import './autoInitUI.js';

// Elements
const gallery = $(".gallery");
const galleryUpload = $("#galleryUpload");
const fab = $("#fab");
const galleryEmptyCTA = $("#gallery-empty-cta");
const ctaUploadBtn = $("#cta-upload-btn");
const composeModal = $("#composeLetter");
const letterTextarea = $("#letterTextarea");
const saveLetterBtn = $("#saveLetter");
const cancelLetterBtn = $("#cancelLetter");
const letterDisplay = $(".letter-display");
const candlesGrid = document.querySelector("#candles .candles-grid");
// Theme toggle
const themeToggleBtn = $("#themeToggle");
const THEME_PREF_KEY = "eternal_theme";

export function renderMemorialPage(profile) {
  document.querySelector("main.memorialPage").classList.remove("hidden")
  const bannerEl = document.querySelector("main.memorialPage .rememberedOneProfile .banner");
  if (profile.coverPhoto) {
    bannerEl.style.backgroundImage = `url("${profile.coverPhoto}")`;
    bannerEl.style.backgroundRepeat = "no-repeat";
    bannerEl.style.backgroundSize = "cover";
    bannerEl.style.backgroundPosition = "center";
    bannerEl.style.backgroundColor = "#f6f7fb";
  } else {
    bannerEl.style.background = "linear-gradient(90deg,#cde7ff,#f9dff2)";
  }
  const picDiv = document.querySelector(
    "main.memorialPage .rememberedOneProfile .pic"
  );
 
  if (profile.profilePic) {
    picDiv.style.backgroundImage = `url("${profile.profilePic}")`;
    picDiv.style.backgroundRepeat = "no-repeat";
    picDiv.style.backgroundSize = "cover";
    picDiv.style.objectFit = "cover";
    picDiv.style.backgroundPosition = "center";
    picDiv.style.backgroundColor = "#f6f7fb";
    picDiv.style.borderRadius = "50%"; // Ensure circular shape
    picDiv.style.overflow = "hidden"; // Ensure image is cropped to the circle
  } else {
    picDiv.style.background = "linear-gradient(90deg,#cde7ff,#f9dff2)";
    picDiv.style.borderRadius = "50%"; // Keep circular shape for fallback
  }
  picDiv.setAttribute("aria-label", `Profile picture of ${profile.name}`);
  document.querySelector(
    "main.memorialPage .rememberedOneProfile .name"
  ).textContent = profile.name;
  document.querySelector(
    "main.memorialPage .rememberedOneProfile .lifedates"
  ).textContent = `${profile.birthdate} - ${profile.lastday}`;
  document.querySelector(
    "blockquote.remark"
  ).textContent = profile.remark;
  // Render memories

  const memories = profile.memories;
  gallery.innerHTML = ""; // Clear existing

  memories.forEach((memory) => {
    const div = document.createElement("div");
    div.className = "gallery-item";
    div.dataset.id = memory.id;
    div.dataset.title = memory.title;
    div.dataset.uploaded = memory.createdAt;

    const img = document.createElement("img");
    img.src = memory.imageUrl;
    img.alt = memory.title;
    img.className = "gallery-img";

    const menu = document.createElement("div");
    menu.className = "menu";
    menu.innerHTML = `<button class="menu-button" aria-haspopup="true" aria-expanded="false" aria-label="More options"><svg width="16" height="16"><use href="#icon-more"/></svg></button><ul class="dropdown-menu" role="menu" hidden><li role="none"><button role="menuitem" class="dropdown-item" data-action="details">Details</button></li></ul>`;

    const label = document.createElement("div");
    label.className = "metadata-overlay";
    label.innerHTML = `<span class="by-line">By ${memory.uploadedBy}</span>`;

    div.appendChild(img);
    div.appendChild(menu);
    div.appendChild(label);
    gallery.appendChild(div);
  });
  updateGalleryCTA();
  // notify other modules that the memorial page was rendered
  try {
    document.dispatchEvent(new CustomEvent('memorial:rendered', { detail: profile }));
  } catch (e) {
    // ignore environments that don't support CustomEvent
  }
}

function updateGalleryCTA() {
  // Ensure we wait for next tick so DOM is updated
  setTimeout(() => {
    if (!galleryEmptyCTA) return;
    const items = gallery.querySelectorAll(".gallery-item");
    const hasItems = items && items.length > 0;
    if (hasItems) galleryEmptyCTA.setAttribute("hidden", "");
    else galleryEmptyCTA.removeAttribute("hidden");
  }, 0);
}

// Render memorial profiles as sections using the same classes you commented earlier
export function renderMemorialProfilesList(profiles = []) {
  const container = document.querySelector('.memorial-profiles-list');
  if (!container) {
    console.warn('renderMemorialProfilesList: .memorial-profiles-list container not found');
    return;
  }

  // Clear existing
  container.innerHTML = '';

  if (!profiles || !profiles.length) {
    // Render an accessible empty state
    container.innerHTML = `<div class="gallery-empty-cta muted">No memorial profiles found.</div>`;
    return;
  }

  profiles.forEach(p => {
    const section = document.createElement('section');
    section.className = 'rememberedOneProfile';
    section.dataset.id = p.id || '';

    const pic = document.createElement('div');
    pic.className = 'pic';
    pic.setAttribute('role', 'img');
    pic.setAttribute('aria-label', `Profile picture of ${p.name || ''}`);
    if (p.profilePic) pic.style.backgroundImage = `url(${p.profilePic})`;
    pic.textContent = p.name ? p.name.slice(0,2).toUpperCase() : '';

    const meta = document.createElement('div');
    meta.className = 'profileMeta';
    const h2 = document.createElement('h2');
    h2.className = 'name';
    h2.textContent = p.name || '';
    meta.appendChild(h2);

    section.appendChild(pic);
    section.appendChild(meta);

    // clicking the section navigates to memorial_page/:id
    section.addEventListener('click', (e) => {
      e.preventDefault();
      if (p.id) {
        history.pushState({}, '', `/memorial_page/${encodeURIComponent(p.id)}`);
        // trigger a simple reload of the routing logic by dispatching a custom event
        document.dispatchEvent(new CustomEvent('route:changed', { detail: { path: window.location.pathname } }));
      }
    });

    container.appendChild(section);
  });
}
