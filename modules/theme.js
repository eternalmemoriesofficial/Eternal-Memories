const THEME_PREF_KEY = 'eternal_theme';

function applyTheme(theme) {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');

  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    const icon = btn.querySelector('.theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(THEME_PREF_KEY, next); } catch (e) { /* ignore */ }
  applyTheme(next);
}

// Initialize on load
try {
  const saved = localStorage.getItem(THEME_PREF_KEY);
  if (saved) applyTheme(saved);
  else if (window.matchMedia) applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  else applyTheme('light');
} catch (e) {
  applyTheme('light');
}

// Wire toggle button when available
document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('#themeToggle');
  if (btn) {
    e.preventDefault();
    toggleTheme();
  }
});

export { applyTheme, toggleTheme };
