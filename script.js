/* ============================================================
   WEB AUDIO ENGINE
   ============================================================ */
const StageAudio = (function () {
  let ctx = null;
  function init() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function note(freq, dur = 0.6, type = 'sine', vol = 0.18, delay = 0) {
    const c = init(); if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator(); const gain = c.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }
  function noise(duration = 6, filterFreq = 1600, vol = 0.35) {
    const c = init(); if (!c) return;
    const sampleCount = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, sampleCount, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) data[i] = (Math.random() * 2 - 1);
    const src = c.createBufferSource(); src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = filterFreq; filter.Q.value = 0.7;
    const gain = c.createGain(); const t0 = c.currentTime;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.25);
    gain.gain.setValueAtTime(vol, t0 + duration - 1.2);
    gain.gain.linearRampToValueAtTime(0, t0 + duration);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t0); src.stop(t0 + duration + 0.1);
  }
  return {
    init, note,
    orchestraTune() {
      const c = init(); if (!c) return;
      const targets = [220, 330, 440, 293.66, 392];
      targets.forEach((f, i) => {
        const t0 = c.currentTime + i * 0.35;
        const osc = c.createOscillator(); const gain = c.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f * 0.97, t0);
        osc.frequency.linearRampToValueAtTime(f, t0 + 0.7);
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.045, t0 + 0.15);
        gain.gain.linearRampToValueAtTime(0, t0 + 1.9);
        const filter = c.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 2200;
        osc.connect(filter).connect(gain).connect(c.destination);
        osc.start(t0); osc.stop(t0 + 2);
      });
    },
    applause(duration = 7) {
      const c = init(); if (!c) return;
      noise(duration, 1400, 0.32);
      noise(duration, 2400, 0.18);
      const clapCount = Math.floor(duration * 4);
      for (let i = 0; i < clapCount; i++) {
        const delay = Math.random() * (duration - 0.3);
        setTimeout(() => {
          const t0 = c.currentTime;
          const osc = c.createOscillator(); const gain = c.createGain();
          osc.type = 'square';
          osc.frequency.value = 800 + Math.random() * 1200;
          const f = c.createBiquadFilter();
          f.type = 'bandpass'; f.frequency.value = 2000; f.Q.value = 3;
          gain.gain.setValueAtTime(0.05, t0);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
          osc.connect(f).connect(gain).connect(c.destination);
          osc.start(t0); osc.stop(t0 + 0.08);
        }, delay * 1000);
      }
    },
    tick() { note(880, 0.08, 'triangle', 0.06); },
    thump() {
      const c = init(); if (!c) return;
      const t0 = c.currentTime;
      const osc = c.createOscillator(); const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t0);
      osc.frequency.exponentialRampToValueAtTime(55, t0 + 0.4);
      gain.gain.setValueAtTime(0.35, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6);
      osc.connect(gain).connect(c.destination);
      osc.start(t0); osc.stop(t0 + 0.65);
    },
    pulse() {
      // Neural transmission sound — a soft high ping
      note(1200, 0.25, 'sine', 0.08);
      setTimeout(() => note(1600, 0.35, 'sine', 0.06), 60);
    }
  };
})();

/* ============================================================
   CURTAIN SYSTEM — direct transform, always reliable
   ============================================================ */
const Curtain = (function () {
  const left = document.getElementById('curtain-left');
  const right = document.getElementById('curtain-right');
  const CLOSED_L = 'translateX(0)';
  const CLOSED_R = 'translateX(0)';
  const OPEN_L   = 'translateX(-102%)';
  const OPEN_R   = 'translateX(102%)';

  function setInitialClosed() {
    left.style.display = 'block';
    right.style.display = 'block';
    left.style.transform = CLOSED_L;
    right.style.transform = CLOSED_R;
  }
  function open() {
    left.style.display = 'block';
    right.style.display = 'block';
    // Force the browser to see current position first
    left.style.transform = CLOSED_L;
    right.style.transform = CLOSED_R;
    void left.offsetWidth;
    requestAnimationFrame(() => {
      left.style.transform = OPEN_L;
      right.style.transform = OPEN_R;
    });
  }
  function close() {
    left.style.display = 'block';
    right.style.display = 'block';
    // Reset to open position first (in case they were hidden)
    left.style.transform = OPEN_L;
    right.style.transform = OPEN_R;
    void left.offsetWidth;
    requestAnimationFrame(() => {
      left.style.transform = CLOSED_L;
      right.style.transform = CLOSED_R;
    });
  }
  return { setInitialClosed, open, close };
})();

/* ============================================================
   OVERTURE
   ============================================================ */
(function initOverture() {
  const overture = document.getElementById('overture');
  const title = document.getElementById('overture-title');
  const letters = title.querySelectorAll('span');
  const shimmer = document.getElementById('overture-shimmer');
  const sub = document.getElementById('overture-sub');
  const skip = document.getElementById('overture-skip');

  // Curtains start closed and visible
  Curtain.setInitialClosed();

  let audioUnlocked = false;
  function unlock() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    StageAudio.init();
    StageAudio.orchestraTune();
  }
  document.addEventListener('click', unlock, { once: true });
  document.addEventListener('keydown', unlock, { once: true });

  setTimeout(() => { try { StageAudio.init(); StageAudio.orchestraTune(); } catch (e) {} }, 400);

  letters.forEach((span, i) => {
    setTimeout(() => span.classList.add('on'), 300 + i * 180);
  });
  setTimeout(() => shimmer.classList.add('sweep'), 2200);
  setTimeout(() => sub.classList.add('on'), 2400);
  setTimeout(() => skip.classList.add('on'), 3000);

  let ended = false;
  function endOverture() {
    if (ended) return;
    ended = true;
    overture.classList.add('fade');
    setTimeout(() => { overture.style.display = 'none'; }, 1300);
  }
  setTimeout(endOverture, 6000);
  skip.addEventListener('click', endOverture);
})();

/* ============================================================
   ENTER BUTTON
   ============================================================ */
(function initEnter() {
  const overlay = document.getElementById('intro-overlay');
  const btn = document.getElementById('enter-btn');
  btn.addEventListener('click', () => {
    StageAudio.init();
    StageAudio.thump();
    overlay.classList.add('hide');
    Curtain.open();
    setTimeout(() => { overlay.style.display = 'none'; }, 700);
  });
})();

/* ============================================================
   FLOATING NOTES
   ============================================================ */
(function initNotes() {
  const container = document.getElementById('notes-container');
  const notes = [
    `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><ellipse cx="9" cy="18" rx="5" ry="3.5" transform="rotate(-22 9 18)"/><rect x="13" y="3" width="1.6" height="15"/></svg>`,
    `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><ellipse cx="9" cy="18" rx="5" ry="3.5" transform="rotate(-22 9 18)"/><rect x="13" y="3" width="1.6" height="15"/><path d="M14 3 Q21 5 20 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><ellipse cx="9" cy="18" rx="5" ry="3.5" transform="rotate(-22 9 18)"/><rect x="13" y="3" width="1.6" height="15"/><path d="M14 3 Q21 5 20 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M14 7 Q21 9 20 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`
  ];
  function spawn() {
    const n = document.createElement('div');
    n.className = 'music-note';
    n.innerHTML = notes[Math.floor(Math.random() * notes.length)];
    n.style.left = Math.random() * 100 + '%';
    n.style.fontSize = (14 + Math.random() * 22) + 'px';
    const dur = 12 + Math.random() * 14;
    n.style.animationDuration = dur + 's';
    n.style.animationDelay = (Math.random() * 2) + 's';
    container.appendChild(n);
    setTimeout(() => n.remove(), (dur + 3) * 1000);
  }
  setInterval(spawn, 1400);
  for (let i = 0; i < 8; i++) setTimeout(spawn, i * 400);
})();

/* ============================================================
   CURSOR GLOW
   ============================================================ */
(function initGlow() {
  const glow = document.getElementById('cursor-glow');
  let mx = 0, my = 0, gx = 0, gy = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; glow.style.opacity = '1'; });
  document.addEventListener('mouseleave', () => glow.style.opacity = '0');
  (function loop() {
    gx += (mx - gx) * 0.08; gy += (my - gy) * 0.08;
    glow.style.left = gx + 'px'; glow.style.top = gy + 'px';
    requestAnimationFrame(loop);
  })();
})();

/* ============================================================
   LIVING STAGE LIGHTING
   ============================================================ */
const LIGHTING = {
  'crimson':      { a: 'rgba(139,30,53,0.5)',  b: 'rgba(74,14,28,0.7)',   c: 'rgba(212,175,55,0.14)' },
  'golden':       { a: 'rgba(212,150,60,0.35)', b: 'rgba(107,20,40,0.6)', c: 'rgba(232,201,106,0.18)' },
  'maroon':       { a: 'rgba(107,20,40,0.45)', b: 'rgba(74,14,28,0.7)',   c: 'rgba(212,175,55,0.12)' },
  'sepia':        { a: 'rgba(168,140,80,0.3)', b: 'rgba(74,14,28,0.65)',  c: 'rgba(212,175,55,0.15)' },
  'rose':         { a: 'rgba(168,40,70,0.4)',  b: 'rgba(107,20,40,0.7)',  c: 'rgba(232,201,106,0.16)' },
  'midnight':     { a: 'rgba(40,60,110,0.4)',  b: 'rgba(20,10,30,0.75)',  c: 'rgba(150,180,240,0.1)' },
  'blood':        { a: 'rgba(160,20,40,0.55)', b: 'rgba(60,4,10,0.8)',    c: 'rgba(232,60,80,0.18)' },
  'crimson-deep': { a: 'rgba(140,10,30,0.5)',  b: 'rgba(60,4,10,0.8)',    c: 'rgba(212,80,60,0.14)' },
  'amber':        { a: 'rgba(212,140,40,0.4)', b: 'rgba(107,40,20,0.65)', c: 'rgba(232,201,106,0.2)' },
  'teal':         { a: 'rgba(42,111,111,0.35)', b: 'rgba(20,40,50,0.7)',  c: 'rgba(150,220,220,0.12)' },
  'dawn':         { a: 'rgba(230,180,100,0.4)', b: 'rgba(140,80,40,0.6)',  c: 'rgba(240,220,180,0.2)' },
  'cream':        { a: 'rgba(220,200,160,0.28)', b: 'rgba(107,20,40,0.55)', c: 'rgba(245,240,232,0.14)' },
  'finale':       { a: 'rgba(212,175,55,0.4)', b: 'rgba(107,20,40,0.75)',  c: 'rgba(232,201,106,0.22)' }
};
function applyLighting(name) {
  const L = LIGHTING[name] || LIGHTING.maroon;
  const root = document.documentElement;
  root.style.setProperty('--ambient-a', L.a);
  root.style.setProperty('--ambient-b', L.b);
  root.style.setProperty('--ambient-c', L.c);
}

/* ============================================================
   PAGE NAVIGATION — reliable curtain cycle
   ============================================================ */
const PAGE_ORDER = ['cover','gabz','contents','origins','creative','characters','web','story','music','evaluation','closing','sources','end'];
let currentIndex = 0;
let animating = false;

const pages = document.querySelectorAll('.page');
const indicator = document.getElementById('page-indicator');
const prevBtn = document.getElementById('prev-page');
const nextBtn = document.getElementById('next-page');

function goTo(pageId, opts) {
  opts = opts || {};
  const idx = PAGE_ORDER.indexOf(pageId);
  if (idx < 0 || animating) return;
  if (idx === currentIndex && !opts.force) return;
  animating = true;

  StageAudio.tick();
  Curtain.close();

  // After curtain closed, switch page
  setTimeout(() => {
    pages.forEach(p => p.classList.remove('active'));
    const target = document.querySelector(`.page[data-page="${pageId}"]`);
    if (target) {
      target.classList.add('active');
      target.scrollTop = 0;
      applyLighting(target.dataset.lighting || 'maroon');
      triggerRevealFor(target);
      animateCounters(target);
      if (pageId === 'end') onEndPage();
      else stopApplauseHint();
      if (pageId === 'web') NeuralWeb.activate();
      else NeuralWeb.deactivate();
    }
    currentIndex = idx;
    updateIndicator();

    setTimeout(() => {
      Curtain.open();
      setTimeout(() => {
        animating = false;
      }, 1200);
    }, 150);
  }, 1100);
}

function updateIndicator() {
  indicator.textContent = `${currentIndex + 1} / ${PAGE_ORDER.length}`;
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === PAGE_ORDER.length - 1;
}
function next() { if (currentIndex < PAGE_ORDER.length - 1) goTo(PAGE_ORDER[currentIndex + 1]); }
function prev() { if (currentIndex > 0) goTo(PAGE_ORDER[currentIndex - 1]); }
function restart() { goTo('cover', { force: true }); }

prevBtn.addEventListener('click', prev);
nextBtn.addEventListener('click', next);
document.querySelectorAll('[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => goTo(btn.dataset.goto));
});

const menuOverlay = document.getElementById('menu-overlay');
document.getElementById('menu-toggle').addEventListener('click', () => menuOverlay.classList.add('open'));
document.getElementById('menu-close').addEventListener('click', () => menuOverlay.classList.remove('open'));
document.querySelectorAll('#menu-nav button').forEach(btn => {
  btn.addEventListener('click', () => { menuOverlay.classList.remove('open'); goTo(btn.dataset.page); });
});

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); next(); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); prev(); }
  if (e.key === 'Escape') menuOverlay.classList.remove('open');
});

/* ============================================================
   REVEAL
   ============================================================ */
function triggerRevealFor(pageEl) {
  if (!pageEl) return;
  const els = pageEl.querySelectorAll('.reveal');
  els.forEach(el => el.classList.remove('visible'));
  requestAnimationFrame(() => {
    els.forEach((el, i) => setTimeout(() => el.classList.add('visible'), i * 60));
  });
}
document.querySelectorAll('.page').forEach(p => {
  p.querySelectorAll('.card, .toc-item, .timeline-item, .story-step, .song-card, .source-item, .stat-item, .expect-item, .flip-card, .image-frame, .quote, .presenter-stage, .notes-legend, .score-card, .neural-wrap').forEach(el => {
    if (!el.classList.contains('reveal')) el.classList.add('reveal');
  });
});

/* ============================================================
   TABS — event delegation (bulletproof)
   ============================================================ */
(function initTabs() {
  const tabsContainer = document.getElementById('tabs');
  if (!tabsContainer) return;
  const evaluationPage = document.querySelector('.page[data-page="evaluation"]');

  tabsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const target = btn.dataset.tab;
    if (!target || !evaluationPage) return;

    // Update buttons
    tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update panels
    evaluationPage.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const panel = evaluationPage.querySelector(`.tab-panel[data-panel="${target}"]`);
    if (panel) panel.classList.add('active');

    StageAudio.tick();
  }, true); // capture phase
})();

/* ============================================================
   WINDMILL
   ============================================================ */
(function initWindmill() {
  const stage = document.getElementById('windmill-stage');
  if (!stage) return;
  const cards = Array.from(stage.querySelectorAll('.windmill-card'));
  const dots = Array.from(document.querySelectorAll('#windmill-dots button'));
  const prevBtnW = document.getElementById('windmill-prev');
  const nextBtnW = document.getElementById('windmill-next');
  let current = 0;
  const total = cards.length;
  function update() {
    cards.forEach((card, i) => {
      const offset = (i - current + total) % total;
      card.classList.remove('pos-center', 'pos-right', 'pos-left');
      if (offset === 0) card.classList.add('pos-center');
      else if (offset === 1) card.classList.add('pos-right');
      else card.classList.add('pos-left');
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }
  nextBtnW.addEventListener('click', () => { current = (current + 1) % total; update(); StageAudio.tick(); });
  prevBtnW.addEventListener('click', () => { current = (current - 1 + total) % total; update(); StageAudio.tick(); });
  dots.forEach(d => d.addEventListener('click', () => { current = parseInt(d.dataset.index, 10); update(); }));
  cards.forEach((card, i) => {
    card.addEventListener('click', () => { if (i !== current) { current = i; update(); StageAudio.tick(); } });
  });
  update();
})();

/* ============================================================
   FLIP CARDS
   ============================================================ */
(function initFlip() {
  document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('flipped'));
    card.addEventListener('mouseenter', () => card.classList.add('flipped'));
    card.addEventListener('mouseleave', () => card.classList.remove('flipped'));
  });
})();

/* ============================================================
   SONG PLAYBACK
   ============================================================ */
(function initSongs() {
  let currentAudio = null, currentCard = null, playTimer = null;
  const PLAY_LIMIT_MS = 5000;
  function stopAll() {
    if (currentAudio) { try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {} currentAudio = null; }
    if (playTimer) { clearTimeout(playTimer); playTimer = null; }
    if (currentCard) currentCard.classList.remove('playing');
    currentCard = null;
  }
  document.querySelectorAll('.song-card').forEach(card => {
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        card.click();
      }
    });
    card.addEventListener('click', () => {
      const wasPlaying = card === currentCard && currentAudio && !currentAudio.paused;
      document.querySelectorAll('.song-card').forEach(c => c.classList.remove('open'));
      stopAll();
      if (wasPlaying) return;
      card.classList.add('open');
      const src = card.dataset.audio;
      if (!src || card.dataset.audioAvailable === "false") return;
      const audio = new window.Audio();
      audio.src = src; audio.volume = 0.7;
      currentAudio = audio; currentCard = card;
      let fellBack = false;
      audio.addEventListener('error', () => {
        if (fellBack) return;
        fellBack = true;
        const phrases = {
          '1': [523.25, 587.33, 659.25, 783.99, 659.25],
          '2': [392, 523.25, 587.33, 523.25, 392],
          '3': [440, 523.25, 659.25, 587.33, 523.25],
          '4': [587.33, 523.25, 440, 493.88, 587.33],
          '5': [659.25, 587.33, 523.25, 493.88, 440]
        };
        const seq = phrases[card.dataset.song] || [440, 523.25, 659.25];
        seq.forEach((f, i) => StageAudio.note(f, 0.9, 'triangle', 0.16, i * 0.55));
        card.classList.add('playing');
        playTimer = setTimeout(stopAll, PLAY_LIMIT_MS);
      });
      audio.addEventListener('canplay', () => {
        card.classList.add('playing');
        audio.play().catch(() => {});
      }, { once: true });
      audio.addEventListener('ended', stopAll);
      audio.load();
      playTimer = setTimeout(stopAll, PLAY_LIMIT_MS);
    });
  });
  const musicPage = document.querySelector('.page[data-page="music"]');
  if (musicPage) {
    const mo = new MutationObserver(() => { if (!musicPage.classList.contains('active')) stopAll(); });
    mo.observe(musicPage, { attributes: true, attributeFilter: ['class'] });
  }
})();

/* ============================================================
   INTERACTIVE SCORE
   ============================================================ */
(function initScore() {
  const body = document.getElementById('score-body');
  if (!body) return;
  const phrases = [
    { notes: [{ f: 523.25, y: 0.6 }, { f: 587.33, y: 0.4 }, { f: 659.25, y: 0.2 }, { f: 587.33, y: 0.4 }, { f: 523.25, y: 0.6 }] },
    { notes: [{ f: 392, y: 0.4 }, { f: 523.25, y: 0.5 }, { f: 587.33, y: 0.3 }, { f: 523.25, y: 0.5 }, { f: 392, y: 0.4 }] },
    { notes: [{ f: 440, y: 0.55 }, { f: 523.25, y: 0.4 }, { f: 659.25, y: 0.2 }, { f: 587.33, y: 0.35 }, { f: 523.25, y: 0.55 }] },
    { notes: [{ f: 587.33, y: 0.5 }, { f: 523.25, y: 0.4 }, { f: 440, y: 0.35 }, { f: 493.88, y: 0.55 }, { f: 587.33, y: 0.5 }] },
    { notes: [{ f: 659.25, y: 0.35 }, { f: 587.33, y: 0.5 }, { f: 523.25, y: 0.6 }, { f: 493.88, y: 0.55 }, { f: 440, y: 0.5 }] }
  ];
  const clefSVG = `<svg class="score-clef" viewBox="0 0 30 60" width="30" height="60" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M15 55 C 8 55 6 48 12 42 C 20 34 22 26 18 18 C 14 10 12 4 15 2 C 18 4 18 12 14 20 C 10 30 12 44 20 48"/><circle cx="15" cy="52" r="2.5"/></svg>`;
  phrases.forEach((phrase, pi) => {
    const wrap = document.createElement('div');
    wrap.className = 'score-phrase';
    const measure = document.createElement('div');
    measure.className = 'score-measure';
    const staff = document.createElement('div');
    staff.className = 'score-staff';
    for (let i = 0; i < 5; i++) { const l = document.createElement('div'); l.className = 'score-line'; staff.appendChild(l); }
    const notesWrap = document.createElement('div');
    notesWrap.className = 'score-notes';
    phrase.notes.forEach((n, ni) => {
      const dot = document.createElement('div');
      dot.className = 'score-note';
      dot.dataset.freq = n.f;
      dot.style.left = (ni * 60 + 30) + 'px';
      dot.style.top = (n.y * 100) + '%';
      notesWrap.appendChild(dot);
    });
    measure.appendChild(document.createElement('div')).innerHTML = clefSVG;
    measure.appendChild(staff);
    measure.appendChild(notesWrap);
    wrap.appendChild(measure);
    notesWrap.querySelectorAll('.score-note').forEach(dot => {
      dot.addEventListener('mouseenter', () => {
        StageAudio.note(parseFloat(dot.dataset.freq), 0.6, 'triangle', 0.18);
        dot.classList.add('active');
        setTimeout(() => dot.classList.remove('active'), 400);
      });
    });
    wrap.addEventListener('click', () => {
      document.querySelectorAll('.score-phrase.playing').forEach(p => p.classList.remove('playing'));
      wrap.classList.add('playing');
      phrase.notes.forEach((n, i) => {
        const dot = notesWrap.children[i];
        StageAudio.note(n.f, 0.85, 'triangle', 0.16, i * 0.55);
        setTimeout(() => {
          dot.classList.add('active');
          setTimeout(() => dot.classList.remove('active'), 500);
        }, i * 550);
      });
      setTimeout(() => wrap.classList.remove('playing'), phrase.notes.length * 600 + 400);
    });
    body.appendChild(wrap);
  });
})();

/* ============================================================
   NEURAL WEB — brain-like, light pulses travel along synapses
   ============================================================ */
const NeuralWeb = (function () {
  const wrap = document.getElementById('neural-wrap');
  const svg = document.getElementById('neural-svg');
  if (!wrap || !svg) return { activate: () => {}, deactivate: () => {} };

  const synapsesG = document.getElementById('neural-synapses');
  const pulsesG = document.getElementById('neural-pulses');
  const neuronsG = document.getElementById('neural-neurons');
  const brainBg = document.getElementById('neural-brain-bg');
  const capTitle = document.getElementById('neural-caption-title');
  const capText = document.getElementById('neural-caption-text');

  const NEURONS = {
    porgy:   { x: 130, y: 320, label: 'PORGY',    sub: 'the beggar' },
    bess:    { x: 400, y: 130, label: 'BESS',     sub: 'seeking a life' },
    crown:   { x: 670, y: 320, label: 'CROWN',    sub: 'the violent man' },
    sportin: { x: 400, y: 510, label: "SPORTIN'", sub: 'the schemer' }
  };

  const SYNAPSES = [
    { id: 'pb', from: 'porgy',   to: 'bess',    title: 'Porgy → Bess · Devotion',       text: "A love that gives Porgy purpose and Bess, for the first time, a home. Their bond is the opera's fragile centre." },
    { id: 'bc', from: 'bess',    to: 'crown',   title: 'Bess → Crown · The Past',       text: "A hold Bess cannot escape. Crown's pull on her is violent, possessive, and — despite everything — familiar." },
    { id: 'bs', from: 'bess',    to: 'sportin', title: "Bess → Sportin' Life · Temptation", text: "Sportin' Life offers Bess escape and vice — 'happy dust', New York, and a life without judgement." },
    { id: 'pc', from: 'porgy',   to: 'crown',   title: 'Porgy → Crown · Enmity',        text: "Crown threatens everything Porgy has built. Their confrontation is the opera's dark turning point." },
    { id: 'ps', from: 'porgy',   to: 'sportin', title: "Porgy → Sportin' Life · Opposites", text: "Sportin' Life mocks the very faith and honesty Porgy holds dear. Their scenes crackle with quiet contempt." },
    { id: 'cs', from: 'crown',   to: 'sportin', title: "Crown → Sportin' Life · Rivals",  text: "Two manipulators circling the same prey. Crown uses force; Sportin' Life uses charm. Neither has Bess's good in mind." }
  ];

  const pathEls = {};
  const nodeEls = {};
  let active = false;
  let autoTimer = null;
  let currentPulse = null;

  // Build brain-like background
  (function buildBrainBg() {
    const cx = 400, cy = 320;
    for (let r = 80; r <= 320; r += 40) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
      brainBg.appendChild(c);
    }
    // Random "synapse noise" arcs
    for (let i = 0; i < 26; i++) {
      const x1 = 80 + Math.random() * 640;
      const y1 = 80 + Math.random() * 480;
      const x2 = x1 + (Math.random() - 0.5) * 180;
      const y2 = y1 + (Math.random() - 0.5) * 180;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} Q ${(x1+x2)/2 + 30} ${(y1+y2)/2 - 30} ${x2} ${y2}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(212,175,55,0.05)');
      path.setAttribute('stroke-width', '0.8');
      brainBg.appendChild(path);
    }
  })();

  // Compute curved path between two points
  function computePath(from, to) {
    const a = NEURONS[from];
    const b = NEURONS[to];
    // Perpendicular offset for curve
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    // Perpendicular unit vector
    const px = -dy / dist;
    const py = dx / dist;
    // Curve offset (varies by synapse to avoid overlap)
    const offset = dist * 0.14;
    const cx = mx + px * offset;
    const cy = my + py * offset;
    return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  }

  // Build synapses
  SYNAPSES.forEach(s => {
    const d = computePath(s.from, s.to);
    const basePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    basePath.setAttribute('d', d);
    basePath.setAttribute('class', 'neural-synapse-base');
    basePath.dataset.rel = s.id;
    synapsesG.appendChild(basePath);

    const flowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    flowPath.setAttribute('d', d);
    flowPath.setAttribute('class', 'neural-synapse-flow');
    flowPath.dataset.rel = s.id;
    // Stagger animation delays so they don't all flow in sync
    flowPath.style.animationDelay = (Math.random() * -3) + 's';
    synapsesG.appendChild(flowPath);

    pathEls[s.id] = flowPath;

    // Hover handlers on the flow path (has wider hit area via stroke)
    flowPath.style.pointerEvents = 'stroke';
    flowPath.addEventListener('mouseenter', () => { setCaption(s.title, s.text); });
    flowPath.addEventListener('mouseleave', () => { setCaption('The Neural Web of Catfish Row', defaultText); });
  });

  // Build neurons
  Object.entries(NEURONS).forEach(([key, n]) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'neuron');
    g.setAttribute('transform', `translate(${n.x}, ${n.y})`);
    g.dataset.node = key;

    // Dendrites radiating outward
    const dendriteCount = 8;
    for (let i = 0; i < dendriteCount; i++) {
      const angle = (i / dendriteCount) * Math.PI * 2 + Math.random() * 0.3;
      const len = 55 + Math.random() * 30;
      const x2 = Math.cos(angle) * len;
      const y2 = Math.sin(angle) * len;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M 0 0 L ${x2} ${y2}`);
      path.setAttribute('class', 'dendrite');
      g.appendChild(path);
      // Small tendrils
      const bx = Math.cos(angle) * len * 0.65;
      const by = Math.sin(angle) * len * 0.65;
      const t1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      t1.setAttribute('d', `M ${bx} ${by} Q ${bx + Math.cos(angle+0.6)*10} ${by + Math.sin(angle+0.6)*10} ${bx + Math.cos(angle+0.9)*20} ${by + Math.sin(angle+0.9)*20}`);
      t1.setAttribute('class', 'dendrite');
      g.appendChild(t1);
      const t2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      t2.setAttribute('d', `M ${bx} ${by} Q ${bx + Math.cos(angle-0.6)*10} ${by + Math.sin(angle-0.6)*10} ${bx + Math.cos(angle-0.9)*20} ${by + Math.sin(angle-0.9)*20}`);
      t2.setAttribute('class', 'dendrite');
      g.appendChild(t2);
    }

    // Halo
    const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    halo.setAttribute('r', '72');
    halo.setAttribute('fill', 'url(#neuronHalo)');
    halo.setAttribute('class', 'halo');
    g.appendChild(halo);

    // Body
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    body.setAttribute('r', '40');
    body.setAttribute('class', 'body');
    g.appendChild(body);

    // Core
    const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    core.setAttribute('r', '16');
    core.setAttribute('class', 'core');
    g.appendChild(core);

    // Label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('y', '-4');
    text.textContent = n.label;
    g.appendChild(text);
    const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sub.setAttribute('y', '14');
    sub.setAttribute('class', 'sub');
    sub.textContent = n.sub;
    g.appendChild(sub);

    g.addEventListener('click', (e) => {
      e.stopPropagation();
      pulseFrom(key);
    });

    neuronsG.appendChild(g);
    nodeEls[key] = g;
  });

  const defaultText = "Four souls connected by six living bonds. Click anywhere to send a pulse of light travelling along a neural pathway, revealing what flows between them.";

  function setCaption(title, text) {
    if (capTitle) capTitle.innerHTML = title;
    if (capText) capText.innerHTML = text;
  }

  function getPointOnPath(path, t) {
    const len = path.getTotalLength();
    return path.getPointAtLength(len * t);
  }

  function flashNeuron(key) {
    const n = nodeEls[key];
    if (!n) return;
    n.classList.add('flash');
    setTimeout(() => n.classList.remove('flash'), 900);
  }

  function sendPulse(synapseId, sourceKey, targetKey, onArrive) {
    const path = pathEls[synapseId];
    if (!path) return;
    // Cancel any existing pulse
    if (currentPulse) { currentPulse.remove(); currentPulse = null; }

    const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pulse.setAttribute('r', '7');
    pulse.setAttribute('class', 'neural-pulse');
    pulsesG.appendChild(pulse);
    currentPulse = pulse;

    const total = path.getTotalLength();
    const duration = 1400;
    const start = performance.now();

    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      // Ease
      const eased = 1 - Math.pow(1 - t, 2);
      const pt = path.getPointAtLength(total * eased);
      pulse.setAttribute('cx', pt.x);
      pulse.setAttribute('cy', pt.y);
      // Fade in then out
      if (t < 0.15) pulse.setAttribute('opacity', t / 0.15);
      else if (t > 0.85) pulse.setAttribute('opacity', (1 - t) / 0.15);
      else pulse.setAttribute('opacity', 1);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        pulse.remove();
        currentPulse = null;
        if (targetKey) flashNeuron(targetKey);
        if (onArrive) onArrive();
      }
    }
    requestAnimationFrame(step);
  }

  function pickRandomSynapse() {
    return SYNAPSES[Math.floor(Math.random() * SYNAPSES.length)];
  }

  function pulseFrom(nodeKey) {
    if (!active) return;
    // Find a synapse that starts at this node
    const candidates = SYNAPSES.filter(s => s.from === nodeKey || s.to === nodeKey);
    if (candidates.length === 0) return;
    const syn = candidates[Math.floor(Math.random() * candidates.length)];
    const sourceKey = nodeKey === syn.from ? syn.from : syn.to;
    const targetKey = nodeKey === syn.from ? syn.to : syn.from;
    StageAudio.pulse();
    flashNeuron(sourceKey);
    setCaption(syn.title, syn.text);
    sendPulse(syn.id, sourceKey, targetKey);
  }

  function randomPulse() {
    if (!active) return;
    const syn = pickRandomSynapse();
    StageAudio.pulse();
    flashNeuron(syn.from);
    setCaption(syn.title, syn.text);
    sendPulse(syn.id, syn.from, syn.to);
  }

  // Click anywhere on the neural wrap triggers a random pulse
  wrap.addEventListener('click', (e) => {
    if (e.target.closest('.neuron')) return; // neuron has its own handler
    if (e.target.closest('.neural-synapse-flow')) return;
    randomPulse();
  });

  function activate() {
    active = true;
    if (autoTimer) clearInterval(autoTimer);
    // Auto-play a pulse every 3.5 seconds
    autoTimer = setInterval(() => { if (active) randomPulse(); }, 3500);
    // Kick off one immediately
    setTimeout(randomPulse, 500);
  }
  function deactivate() {
    active = false;
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    if (currentPulse) { currentPulse.remove(); currentPulse = null; }
  }

  return { activate, deactivate };
})();

/* ============================================================
   TIMELINE / NOTE LEGEND / COUNTERS
   ============================================================ */
(function initTimeline() {
  document.querySelectorAll('.timeline-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.timeline-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      StageAudio.tick();
    });
  });
})();
(function initNoteLegend() {
  const samples = {
    crotchet: [523.25],
    quaver: [523.25, 587.33],
    semiquaver: [523.25, 587.33, 659.25, 698.46]
  };
  document.querySelectorAll('.note-item[data-note]').forEach(item => {
    item.addEventListener('click', () => {
      const seq = samples[item.dataset.note] || [];
      seq.forEach((f, i) => StageAudio.note(f, 0.35, 'triangle', 0.18, i * 0.25));
    });
  });
})();
function animateCounters(root) {
  if (!root) return;
  root.querySelectorAll('.stat-number').forEach(el => {
    if (el.dataset.done) return;
    el.dataset.done = 'true';
    const target = parseInt(el.dataset.count, 10);
    const duration = 1800;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * target);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  });
}

/* ============================================================
   APPLAUSE
   ============================================================ */
let applausePlayed = false;
function onEndPage() {
  if (applausePlayed) return;
  applausePlayed = true;
  const hint = document.getElementById('applause-hint');
  setTimeout(() => {
    StageAudio.applause(7);
    if (hint) hint.classList.add('on');
  }, 800);
}
function stopApplauseHint() {
  const hint = document.getElementById('applause-hint');
  if (hint) hint.classList.remove('on');
}

/* ============================================================
   RESTART
   ============================================================ */
(function initRestart() {
  const btn = document.getElementById('restart-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    applausePlayed = false;
    stopApplauseHint();
    restart();
  });
})();

/* ============================================================
   INITIAL STATE
   ============================================================ */
(function initialize() {
  const initial = document.querySelector('.page.active');
  if (initial) {
    applyLighting(initial.dataset.lighting || 'maroon');
    triggerRevealFor(initial);
  }
  updateIndicator();
  setTimeout(() => triggerRevealFor(document.querySelector('.page.active')), 100);
})();
