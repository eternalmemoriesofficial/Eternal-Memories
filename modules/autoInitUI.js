import { initMemorialUI } from './uiControls.js';

// Listen for render event and initialize UI controls
(function registerAutoInit(){
  document.addEventListener('memorial:rendered', (e) => {
    const profile = e && e.detail ? e.detail : null;
    const backendOrigin = window.BACKEND_ORIGIN || '';
    if (profile) {
      initMemorialUI(profile, { backendOrigin });
    }
  });
})();
