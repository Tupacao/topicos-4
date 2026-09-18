/* =========================================================
   Motor da apresentação: navegação, persistência, notas,
   visão geral, cronômetro e "imagem surpresa".
   ========================================================= */
(() => {
  'use strict';

  const PREFIX = 'ciber-seminario:';
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* modo privado */ }
    },
    clear() {
      try {
        Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
      } catch (e) { /* ignora */ }
    }
  };
  window.DeckStore = store;

  const BLOCKS = {
    abertura: { label: 'Abertura', color: '#2563EB' },
    b1: { label: 'Bloco 1 · Fundamentos', color: '#2563EB' },
    b2: { label: 'Bloco 2 · Frameworks e Regulações', color: '#0284C7' },
    b3: { label: 'Bloco 3 · Privacidade', color: '#4F46E5' },
    b4: { label: 'Bloco 4 · Inteligência Artificial', color: '#0D9488' },
    b5: { label: 'Complementos', color: '#D97706' },
    b6: { label: 'Questões', color: '#E11D48' },
    b7: { label: 'Encerramento', color: '#0F172A' }
  };

  const stage = document.getElementById('stage');
  const slides = Array.from(stage.querySelectorAll(':scope > .slide'));
  const N = slides.length;
  const $ = id => document.getElementById(id);

  // ---------- Surpresa: configuração ----------
  const CHANCE_START = 5;   // %
  const CHANCE_STEP = 5;    // % acumulado por avanço sem surpresa
  const IMAGES = (Array.isArray(window.RANDOM_IMAGES) ? window.RANDOM_IMAGES : []).filter(Boolean);
  let chance = Number(store.get('chance', CHANCE_START)) || CHANCE_START;
  let pending = null;       // índice do slide "na fila" enquanto a imagem aparece
  let lastImage = store.get('lastImage', null);

  // ---------- Preparação dos slides ----------
  const minutesOf = s => parseFloat(s.querySelector('.notes')?.dataset.min || '0') || 0;
  slides.forEach((s, i) => {
    const b = BLOCKS[s.dataset.block] || BLOCKS.abertura;
    s.style.setProperty('--accent', b.color);
    if (!s.hasAttribute('data-nofoot')) {
      const foot = document.createElement('div');
      foot.className = 'slide-foot';
      foot.innerHTML = `<span>Revisão de Cibersegurança, Normas e Padrões</span><span><b>${b.label}</b> · ${i + 1} / ${N}</span>`;
      s.appendChild(foot);
    }
  });

  // Durações por bloco (a partir das notas) -> agenda e capa
  const blockMin = {};
  let totalMin = 0;
  slides.forEach(s => {
    const m = minutesOf(s);
    blockMin[s.dataset.block] = (blockMin[s.dataset.block] || 0) + m;
    totalMin += m;
  });
  const fmtMin = m => (Math.round(m * 2) / 2).toString().replace('.', ',');
  document.querySelectorAll('[data-block-min]').forEach(el => {
    const k = el.dataset.blockMin;
    let m = blockMin[k] || 0;
    if (k === 'b1') m += blockMin.abertura || 0; // abertura conta no tempo do Bloco 1
    el.textContent = fmtMin(m);
  });
  document.querySelectorAll('[data-total-min]').forEach(el => { el.textContent = fmtMin(totalMin); });

  // ---------- Escala 16:9 ----------
  function fit() {
    const barH = $('bar').offsetHeight;
    const w = window.innerWidth, h = window.innerHeight - barH;
    const scale = Math.min(w / 1600, h / 900) * 0.965;
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }
  window.addEventListener('resize', fit);

  // ---------- Navegação ----------
  let idx = 0;

  function parseHash() {
    const m = location.hash.match(/^#\/?(\d+)/);
    return m ? parseInt(m[1], 10) - 1 : null;
  }
  function writeLocation(i) {
    store.set('slide', i);
    try { history.replaceState(null, '', '#/' + (i + 1)); } catch (e) { location.hash = '#/' + (i + 1); }
  }

  function go(i, opts = {}) {
    i = Math.max(0, Math.min(N - 1, i | 0));
    stage.dataset.dir = i < idx ? 'back' : 'fwd';
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    idx = i;
    writeLocation(i);
    updateUI();
    if (!opts.silent) document.dispatchEvent(new CustomEvent('slide:enter', { detail: { slide: slides[i], index: i } }));
  }

  function next() {
    if (pending !== null) return resolveSurprise();
    if (idx >= N - 1) return;
    const target = idx + 1;
    if (IMAGES.length && Math.random() * 100 < chance) {
      chance = CHANCE_START;
      store.set('chance', chance);
      showSurprise(target);
    } else {
      chance = Math.min(100, chance + CHANCE_STEP);
      store.set('chance', chance);
      go(target);
    }
  }
  function prev() {
    if (pending !== null) return resolveSurprise();
    if (idx > 0) go(idx - 1);
  }

  // ---------- Imagem surpresa ----------
  function pickImage() {
    if (IMAGES.length === 1) return IMAGES[0];
    let img;
    do { img = IMAGES[Math.floor(Math.random() * IMAGES.length)]; } while (img === lastImage);
    lastImage = img;
    store.set('lastImage', img);
    return img;
  }
  function showSurprise(target) {
    pending = target;
    writeLocation(target); // se recarregar a página, já cai no slide da fila
    const img = pickImage();
    $('surprise-img').src = 'images/' + encodeURI(img);
    $('surprise').classList.add('show');
    closeModals();
  }
  function resolveSurprise() {
    const t = pending;
    pending = null;
    $('surprise').classList.remove('show');
    go(t);
  }
  document.querySelectorAll('[data-surprise-go]').forEach(b => b.addEventListener('click', resolveSurprise));

  // ---------- UI da barra ----------
  function updateUI() {
    const s = slides[idx];
    const b = BLOCKS[s.dataset.block] || BLOCKS.abertura;
    $('progress-bar').style.width = ((idx + 1) / N * 100) + '%';
    $('progress-bar').style.background = b.color;
    const chip = $('block-chip');
    chip.textContent = b.label + ' — ' + (s.dataset.title || '');
    chip.style.color = b.color;
    if (document.activeElement !== $('goto')) $('goto').value = idx + 1;
    $('btn-prev').disabled = idx === 0;
    $('btn-next').disabled = idx === N - 1;
    $('btn-prev').style.opacity = idx === 0 ? .4 : 1;
    $('btn-next').style.opacity = idx === N - 1 ? .4 : 1;
    renderNotes();
    renderOverview();
    $('help-chance').textContent = IMAGES.length
      ? `${IMAGES.length} imagem(ns) em /images · chance no próximo avanço: ${chance}%`
      : 'nenhuma imagem cadastrada em images/manifest.js (recurso desativado)';
  }

  $('total').textContent = N;
  $('goto').max = N;
  $('goto').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const v = parseInt(e.target.value, 10);
      if (!isNaN(v)) go(v - 1);
      e.target.blur();
    } else if (e.key === 'Escape') {
      e.target.value = idx + 1;
      e.target.blur();
    }
    e.stopPropagation();
  });
  $('goto').addEventListener('focus', e => e.target.select());
  $('goto').addEventListener('blur', e => { e.target.value = idx + 1; });

  $('btn-prev').addEventListener('click', prev);
  $('btn-next').addEventListener('click', next);

  // ---------- Notas do apresentador ----------
  const drawer = $('notes-drawer');
  let notesOpen = store.get('notesOpen', false);
  function cumulativeMin(i) {
    let m = 0;
    for (let k = 0; k <= i; k++) m += minutesOf(slides[k]);
    return m;
  }
  function renderNotes() {
    const s = slides[idx];
    const n = s.querySelector('.notes');
    drawer.innerHTML = `<h4><span>Slide ${idx + 1} · ${s.dataset.title || ''}</span><span>⏱ ~${fmtMin(minutesOf(s))} min</span><span>Planejado até aqui: ${fmtMin(cumulativeMin(idx))} de ${fmtMin(totalMin)} min</span><span>Decorrido: ${fmtClock(elapsed())}</span></h4>${n ? n.innerHTML : '<p>Sem notas.</p>'}`;
    drawer.classList.toggle('show', notesOpen);
    $('btn-notes').classList.toggle('on', notesOpen);
  }
  function toggleNotes() {
    notesOpen = !notesOpen;
    store.set('notesOpen', notesOpen);
    renderNotes();
  }
  $('btn-notes').addEventListener('click', toggleNotes);

  // ---------- Visão geral ----------
  function renderOverview() {
    const list = $('overview-list');
    list.innerHTML = slides.map((s, i) => {
      const b = BLOCKS[s.dataset.block] || BLOCKS.abertura;
      return `<button class="ov-item ${i === idx ? 'cur' : ''}" data-go="${i}">
        <span class="mono font-bold" style="color:${b.color};width:28px">${String(i + 1).padStart(2, '0')}</span>
        <span class="flex-1">${s.dataset.title || ''}</span>
        <span class="xs muted">${fmtMin(minutesOf(s))} min</span></button>`;
    }).join('');
  }
  $('overview-list').addEventListener('click', e => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    closeModals();
    go(parseInt(b.dataset.go, 10));
  });
  function openModal(id) { closeModals(); $(id).classList.add('show'); }
  function closeModals() { document.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show')); }
  function toggleModal(id) { $(id).classList.contains('show') ? closeModals() : openModal(id); }
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => {
    if (e.target === m || e.target.closest('[data-close]')) closeModals();
  }));
  $('btn-overview').addEventListener('click', () => toggleModal('overview'));
  $('btn-help').addEventListener('click', () => toggleModal('help'));
  $('btn-test-surprise').addEventListener('click', () => {
    closeModals();
    if (!IMAGES.length) { alert('Adicione imagens na pasta /images e rode images/atualizar-manifest.ps1.'); return; }
    showSurprise(Math.min(N - 1, idx + 1));
  });
  $('btn-reset-all').addEventListener('click', () => {
    if (!confirm('Apagar slide atual, cronômetro, checklists e chance da surpresa salvos neste navegador?')) return;
    store.clear();
    location.hash = '#/1';
    location.reload();
  });

  // ---------- Tela cheia ----------
  function toggleFull() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
  $('btn-full').addEventListener('click', toggleFull);
  document.addEventListener('fullscreenchange', () => setTimeout(fit, 50));

  // ---------- Cronômetro da apresentação ----------
  let clock = store.get('clock', { acc: 0, since: null }); // acc em ms; since = timestamp quando rodando
  function elapsed() { return clock.acc + (clock.since ? Date.now() - clock.since : 0); }
  function fmtClock(ms) {
    const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
    const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }
  function renderClock() {
    $('clock').textContent = fmtClock(elapsed());
    $('btn-clock').classList.toggle('on', !!clock.since);
  }
  $('btn-clock').addEventListener('click', () => {
    if (clock.since) { clock.acc += Date.now() - clock.since; clock.since = null; }
    else clock.since = Date.now();
    store.set('clock', clock);
    renderClock();
  });
  $('btn-clock-reset').addEventListener('click', () => {
    clock = { acc: 0, since: null };
    store.set('clock', clock);
    renderClock();
  });
  setInterval(() => {
    renderClock();
    if (notesOpen) {
      const h4 = drawer.querySelector('h4 span:last-child');
      if (h4) h4.textContent = 'Decorrido: ' + fmtClock(elapsed());
    }
  }, 1000);

  // ---------- Teclado ----------
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    const tag = t.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && !['checkbox', 'button'].includes(t.type))) {
      if (e.key === 'Escape') t.blur();
      return; // deixa ranges e campos de texto usarem as setas
    }

    if (pending !== null) {
      if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', ' ', 'Enter', 'PageDown', 'PageUp', 'Escape', 'Backspace'].includes(e.key)) {
        e.preventDefault();
        resolveSurprise();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
        e.preventDefault(); closeModals(); next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
        e.preventDefault(); closeModals(); prev(); break;
      case 'Home': e.preventDefault(); go(0); break;
      case 'End': e.preventDefault(); go(N - 1); break;
      case 'n': case 'N': toggleNotes(); break;
      case 'o': case 'O': toggleModal('overview'); break;
      case 'h': case 'H': case '?': toggleModal('help'); break;
      case 'f': case 'F': toggleFull(); break;
      case 'g': case 'G': e.preventDefault(); $('goto').focus(); break;
      case 't': case 'T':
        document.dispatchEvent(new CustomEvent('deck:timer-toggle', { detail: { slide: slides[idx] } })); break;
      case 'Escape': closeModals(); break;
    }
  });

  // Botões perdem o foco após o clique (Espaço não "reclica" o último botão)
  document.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) b.blur();
  });

  // ---------- Toque (swipe) ----------
  let touchX = null, touchY = null;
  $('viewport').addEventListener('touchstart', e => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
  $('viewport').addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX, dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)();
    touchX = null;
  }, { passive: true });

  // Navegação manual pelo hash (ex.: colar #/12 na URL)
  window.addEventListener('hashchange', () => {
    const h = parseHash();
    if (h !== null && h !== idx) go(h);
  });

  // ---------- Inicialização ----------
  if (window.lucide) lucide.createIcons();
  fit();
  renderClock();
  const fromHash = parseHash();
  const start = fromHash !== null ? fromHash : store.get('slide', 0);
  idx = Math.max(0, Math.min(N - 1, start | 0));
  go(idx);
  // Recalcula a escala quando as fontes terminarem de carregar
  if (document.fonts?.ready) document.fonts.ready.then(fit);
})();
