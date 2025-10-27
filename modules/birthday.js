// Birthday decorations module
// Listens for 'memorial:rendered' events and if the profile's birthdate matches today,
// updates the remark text, decorates the profile pic and shows confetti animation.
let birthday_banner_image_url = '../birthday_cover.jpeg';
function parseISODate(dateStr) {
  if (!dateStr) return null;
  // support yyyy-mm-dd or similar
  const parts = dateStr.split('-').map(p => Number(p));
  if (parts.length < 2) return null;
  return { year: parts[0], month: parts[1], day: parts[2] || 1 };
}

function celebrateBirthday(profile) {
  try {
    const main = document.querySelector('main.memorialPage');
    if (!main) return;

    // Add a class so CSS can style the birthday layout
    main.classList.add('birthday');

    // Change remark to a birthday message
    const remarkEl = document.querySelector('blockquote.remark');
    if (remarkEl) {
      remarkEl.dataset.original = remarkEl.textContent || '';
      remarkEl.textContent = `Happy Birthday, ${profile.name || ''}! We celebrate the life you lived.`;
    }

    // Decorate profile pic (add a ring/badge)
  const pic = document.querySelector('main.memorialPage .rememberedOneProfile .pic');
  const coverPhoto = document.querySelector('main.memorialPage .rememberedOneProfile .banner');
  // only add banner class if banner exists
  
    coverPhoto.style.backgroundImage = `url("${birthday_banner_image_url}")`;
    coverPhoto.style.backgroundRepeat = "no-repeat";
    coverPhoto.style.backgroundSize = "cover";
    coverPhoto.style.backgroundPosition = "center";
    coverPhoto.style.backgroundColor = "#f6f7fb";

    if (pic) {
      pic.classList.add('birthday-pic');
      // add small badge
      /*let badge = pic.querySelector('.birthday-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'birthday-badge';
        badge.innerHTML = '🎉';
        badge.setAttribute('aria-hidden', 'true');
        badge.style.position = 'absolute';
        badge.style.right = '-6px';
        badge.style.top = '-6px';
        badge.style.fontSize = '18px';
        pic.style.position = 'relative';
        pic.appendChild(badge);
      }
        */
      // add birthday frame overlay
      addBirthdayOverlay(pic);
    }

    // Launch confetti (simple DOM-based confetti)
    launchConfetti();
  } catch (e) {
    console.error('celebrateBirthday error', e);
  }
}

function addBirthdayOverlay(pic) {
  if (!pic || pic.querySelector('.birthday-overlay')) return;

  // Create frame overlay with a PNG
  const overlay = document.createElement('div');
  overlay.className = 'birthday-overlay';
  overlay.style.position = 'absolute';
  overlay.style.inset = '0';
  overlay.style.pointerEvents = 'none';
  overlay.style.zIndex = '12';
  
  // Create frame using a transparent PNG that has a decorative border/frame
  const frame = document.createElement('img');
  frame.className = 'birthday-frame';
  // Prefer local project images (relative to modules folder)
  // ../birthday-frame.png (if you add a custom frame) else use PlayerFilled.png as a simple decorative image
  frame.src = '../birthday-frame.png';
  // fallback to an existing image in the project if custom frame not present
  frame.onerror = () => {
    console.warn('birthday-frame.png not found, falling back to PlayerFilled.png');
    frame.src = '../PlayerFilled.png';
  };
  frame.alt = '';
  frame.setAttribute('aria-hidden', 'true');
  // ensure frame scales to overlay
  frame.style.position = 'absolute';
  frame.style.left = '50%';
  frame.style.top = '50%';
  frame.style.transform = 'translate(-50%, -50%)';
  frame.style.width = '110%';
  frame.style.height = '110%';
  frame.style.objectFit = 'contain';
  frame.style.zIndex = '12';
  frame.addEventListener('error', () => console.warn('Birthday frame image failed to load:', frame.src));
  frame.addEventListener('load', () => console.log('Birthday frame loaded'));
  overlay.appendChild(frame);

  // Add sparkle effects using lightweight CSS-only divs (no external images)
  const sparkleCount = 4;
  for (let i = 0; i < sparkleCount; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'birthday-sparkle';
    // random-ish positions around the frame
    const left = 10 + Math.round(Math.random() * 80);
    const top = 5 + Math.round(Math.random() * 80);
    sparkle.style.left = left + '%';
    sparkle.style.top = top + '%';
    sparkle.style.width = '14px';
    sparkle.style.height = '14px';
    sparkle.style.zIndex = '13';
    sparkle.style.opacity = '0.95';
    sparkle.style.pointerEvents = 'none';
    sparkle.style.animationDelay = `${Math.random() * 1.6}s`;
    overlay.appendChild(sparkle);
  }

  pic.style.position = pic.style.position || 'relative';
  pic.appendChild(overlay);
}

function launchConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  container.setAttribute('aria-hidden', 'true');
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '1600';

  const colors = ['#FFD166','#EF476F','#06D6A0','#118AB2','#073B4C','#F4A261'];
  const total = 40;

  for (let i = 0; i < total; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const size = Math.round(Math.random() * 10) + 6;
    el.style.width = `${size}px`;
    el.style.height = `${Math.round(size * 0.6)}px`;
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.position = 'absolute';
    el.style.left = `${Math.random() * 100}%`;
    el.style.top = `${Math.random() * 10}%`;
    el.style.opacity = '0.95';
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    el.style.borderRadius = '2px';
    el.style.willChange = 'transform, top, opacity';
    el.style.transition = `transform ${3 + Math.random() * 2}s cubic-bezier(.2,.8,.2,1), top ${3 + Math.random() * 2}s linear, opacity ${3 + Math.random() * 2}s linear`;
    container.appendChild(el);

    // animate on next tick
    requestAnimationFrame(() => {
      el.style.top = `${80 + Math.random() * 20}%`;
      el.style.transform = `translateY(${200 + Math.random() * 400}px) rotate(${Math.random() * 720}deg)`;
      el.style.opacity = '0';
    });
  }

  document.body.appendChild(container);

  // remove after animation
  setTimeout(() => container.remove(), 7000);
}

// Listen for memorial renders
document.addEventListener('memorial:rendered', (e) => {
  const profile = e && e.detail ? e.detail : null;
  if (!profile) return;

  const parsed = parseISODate(profile.birthdate || profile.birthday || '');
  if (!parsed) return;
  const today = new Date();
  if ((parsed.month === (today.getMonth() + 1) && parsed.day === today.getDate())) {
    celebrateBirthday(profile);
  } else {
    // remove birthday class if present and restore remark
    const main = document.querySelector('main.memorialPage');
    if (main) main.classList.remove('birthday');
    const remarkEl = document.querySelector('blockquote.remark');
    if (remarkEl && remarkEl.dataset && remarkEl.dataset.original) {
      remarkEl.textContent = remarkEl.dataset.original;
      delete remarkEl.dataset.original;
    }
    // remove pic badge if any
    const pic = document.querySelector('main.memorialPage .rememberedOneProfile .pic');
    if (pic) {
      const badge = pic.querySelector('.birthday-badge');
      if (badge) badge.remove();
      pic.classList.remove('birthday-pic');
      // remove overlay if present
      const overlay = pic.querySelector('.birthday-overlay');
      if (overlay) overlay.remove();
    }
  }
});

// Removed SVG overlay code in favor of PNG-based overlays

// Styles moved to style.css

export {};
