// UI controls for memorial page: fab, candles, letters, tabs and CTAs

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export async function initMemorialUI(profile, { backendOrigin = '' } = {}) {
  if (!profile) return;
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
  const tabs = $$('.tab');
  const tabPanels = $$('.tabPanel');

  let candlesSort = 'recent';

  function updateGalleryCTA() {
    setTimeout(() => {
      if (!galleryEmptyCTA) return;
      const items = document.querySelectorAll('.gallery-item');
      const hasItems = items && items.length > 0;
      if (hasItems) galleryEmptyCTA.setAttribute('hidden', ''); else galleryEmptyCTA.removeAttribute('hidden');
    }, 0);
  }

  function renderCandles(candles = []) {
    if (!candlesGrid) return;
    candlesGrid.innerHTML = '';
    if (!candles.length) {
      candlesGrid.innerHTML = '<div class="no-candles">No candles lit yet. Use the + button to light one.</div>';
      return;
    }

    const items = candles.slice();
    if (candlesSort === 'highest') items.sort((a,b) => (b.count||0) - (a.count||0));
    else items.sort((a,b) => {
      const aTime = a.timeStamps ? a.timeStamps[a.timeStamps.length - 1] : '';
      const bTime = b.timeStamps ? b.timeStamps[b.timeStamps.length - 1] : '';
      return new Date(bTime) - new Date(aTime);
    });

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
      el.innerHTML = `<div class="candle-content"><div class="candle-name">${escapeHtml(c.name)}</div><div class="candle-ts">${lastTimestamp ? new Date(lastTimestamp).toLocaleString() : ''}</div></div><div class="candle-count">×${c.count || 0}</div>`;
      candlesGrid.appendChild(el);
    });
  }

  async function loadCandles() {
    try {
      const response = await fetch(`${backendOrigin}/api/memorial_profiles/${profile.id}`);
      if (!response.ok) throw new Error('Failed to fetch profile for candles');
      const data = await response.json();
      renderCandles(data.candles || profile.candles || []);
    } catch (err) {
      console.error('loadCandles error', err);
      renderCandles(profile.candles || []);
    }
  }

  async function addOrIncrementCandle(visitorName) {
    try {
      const response = await fetch(`${backendOrigin}/api/memorial_profiles/${profile.id}/candles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorName })
      });
      if (!response.ok) throw new Error('Failed to light candle');
      await loadCandles();
    } catch (err) {
      console.error('addOrIncrementCandle error', err);
      // fallback: modify local profile
      const existing = (profile.candles || []).find(c => c.name === visitorName);
      if (existing) existing.count = (existing.count||0)+1; else profile.candles = [...(profile.candles||[]), { name: visitorName, count:1, timeStamps:[new Date().toISOString()] }];
      renderCandles(profile.candles);
    }
  }

  function lightCandleFlow() {
    const defaultName = document.querySelector('.name')?.textContent?.trim() || 'You';
    const name = prompt('Enter a name for the candle (who is lighting it):', defaultName);
    if (!name) return;
    addOrIncrementCandle(name.trim());
  }

  function openComposeModal() { if (composeModal) { composeModal.classList.remove('hidden'); composeModal.setAttribute('aria-hidden','false'); letterTextarea?.focus(); } }
  function closeComposeModal() { if (composeModal) { composeModal.classList.add('hidden'); composeModal.setAttribute('aria-hidden','true'); } }

  async function loadLetters() {
    try {
      const response = await fetch(`${backendOrigin}/api/memorial_profiles/${profile.id}`);
      if (!response.ok) throw new Error('Failed to fetch profile for letters');
      const data = await response.json();
      renderLetters(data.letters || profile.letters || []);
    } catch (err) {
      console.error('loadLetters error', err);
      renderLetters(profile.letters || []);
    }
  }

  function renderLetters(letters = []) {
    if (!letterDisplay) return;
    letterDisplay.innerHTML = '';
    if (!letters.length) {
      letterDisplay.innerHTML = '<p class="muted">No letters yet — click the + button while on "Letter to Her" to write one.</p>';
      return;
    }
    const totalLetters = letters.length;
    const uniqueSenders = new Set(letters.map(l => l.sender)).size;
    const statsHtml = `<div class="letters-stats"><div><span>${totalLetters}</span> letters written</div><div><span>${uniqueSenders}</span> heartfelt senders</div></div>`;
    letterDisplay.innerHTML = statsHtml;
    letters.forEach(letter => {
      const el = document.createElement('div'); el.className = 'letter-paper';
      el.innerHTML = `
        <button class="letter-report" title="Report letter">Report</button>
        <div class="letter-body">${escapeHtml(letter.content).replace(/\n/g,'<br>')}</div>
        <div class="letter-signature">— ${escapeHtml(letter.sender)}, ${letter.timeStamp ? new Date(letter.timeStamp).toLocaleDateString() : ''}</div>
      `;
      el.querySelector('.letter-report')?.addEventListener('click', () => { if (confirm('Report this letter?')) alert('Letter reported. Thank you.'); });
      letterDisplay.appendChild(el);
    });
  }

  async function saveLetterObj(obj) {
    try {
      const response = await fetch(`${backendOrigin}/api/memorial_profiles/${profile.id}/letters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: obj.body, sender: obj.sender || 'Anonymous' })
      });
      if (!response.ok) throw new Error('Failed to save letter');
      await loadLetters();
    } catch (err) {
      console.error('saveLetterObj error', err);
      // fallback: push locally
      profile.letters = [...(profile.letters||[]), { content: obj.body, sender: obj.sender || 'Anonymous', timeStamp: new Date().toISOString() }];
      renderLetters(profile.letters);
    }
  }

  // Wire up save and cancel
  saveLetterBtn?.addEventListener('click', () => {
    const raw = letterTextarea?.value || '';
    if (!raw.trim()) { alert('Cannot save an empty letter.'); return; }
    const signer = document.querySelector('.name')?.textContent?.trim() || 'You';
    const dateStr = new Date().toLocaleDateString();
    if (confirm('Posting this letter is irreversible. Do you want to post it?')) {
      saveLetterObj({ body: raw, sender: signer });
      if (letterTextarea) letterTextarea.value = '';
      closeComposeModal();
    }
  });
  cancelLetterBtn?.addEventListener('click', () => closeComposeModal());

  // FAB behavior
  function updateFabBehavior(activeTab) {
    if (!fab) return;
    const icon = fab.querySelector('.fab-icon');
    if (activeTab === 'memories') {
      fab.title = 'Upload memories';
      fab.onclick = () => galleryUpload?.click();
      if (icon) icon.textContent = '+';
    } else if (activeTab === 'letter') {
      fab.title = 'Write letter';
      fab.onclick = () => openComposeModal();
      if (icon) icon.textContent = '✎';
    } else if (activeTab === 'candles') {
      fab.title = 'Light a candle';
      fab.onclick = () => lightCandleFlow();
      if (icon) icon.textContent = '🕯';
    }
  }

  // Tabs wiring
  document.querySelector('.mainNav')?.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    tab.classList.add('active'); tab.setAttribute('aria-selected','true');
    const targetId = tab.dataset.tab;
    tabPanels.forEach(p => { const isTarget = p.id === targetId; p.classList.toggle('hidden', !isTarget); p.setAttribute('aria-hidden', !isTarget); });
    updateFabBehavior(targetId);
    if (targetId === 'letter') loadLetters();
    if (targetId === 'candles') loadCandles();
  });

  // CTA wiring
  ctaUploadBtn?.addEventListener('click', (e) => { e.preventDefault(); galleryUpload?.click(); });

  // expose a small API
  return {
    updateFabBehavior,
    loadCandles,
    loadLetters,
    renderCandles,
    renderLetters,
    openComposeModal,
    closeComposeModal,
    updateGalleryCTA
  };
}

function escapeHtml(str){ return String(str || '').replace(/[&<>\"]/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]||s)); }
