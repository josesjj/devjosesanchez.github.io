(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  /* ---------------- i18n ---------------- */
  const dict = window.I18N || {};
  const saved = localStorage.getItem('lang');
  let lang = saved || ((navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en');
  if (!dict[lang]) lang = 'es';

  function applyLang(l) {
    lang = l;
    const t = dict[l];
    root.lang = l;
    $$('[data-i18n]').forEach(el => {
      const v = t[el.dataset.i18n];
      if (v != null) el.innerHTML = v;
    });
    document.title = t['meta.title'];
    $('meta[name="description"]').setAttribute('content', t['meta.desc']);
    const orbPath = $('#orbTextPath');
    if (orbPath) orbPath.textContent = t.orb;
    $$('.lang button').forEach(b => b.classList.toggle('is-active', b.dataset.lang === l));
    $('.lang').dataset.active = l;
    localStorage.setItem('lang', l);
    rotatorReset();
  }

  $$('.lang button').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.lang !== lang) applyLang(b.dataset.lang);
  }));

  /* ---------------- Rotating words ---------------- */
  const rotator = $('#rotator');
  let wordIdx = 0, rotTimer;
  function rotatorReset() {
    clearInterval(rotTimer);
    wordIdx = 0;
    rotator.innerHTML = `<em class="rotator__word">${dict[lang].words[0]}</em>`;
    if (reduced) return;
    rotTimer = setInterval(() => {
      const words = dict[lang].words;
      const cur = $('.rotator__word', rotator);
      cur.classList.add('is-out');
      setTimeout(() => {
        wordIdx = (wordIdx + 1) % words.length;
        cur.textContent = words[wordIdx];
        cur.classList.remove('is-out');
        cur.classList.add('is-in');
        setTimeout(() => cur.classList.remove('is-in'), 650);
      }, 400);
    }, 2600);
  }

  applyLang(lang);

  /* ---------------- Preloader ---------------- */
  const pre = $('#preloader');
  const preBar = $('#preloaderBar');
  const preCount = $('#preloaderCount');
  document.body.classList.add('is-loading');
  let prog = 0, loaded = document.readyState === 'complete';
  addEventListener('load', () => { loaded = true; });
  setTimeout(() => { loaded = true; }, 2500);
  const preTick = setInterval(() => {
    const target = loaded ? 100 : 85;
    prog = Math.min(target, prog + Math.max(1.5, (target - prog) * (loaded ? .3 : .08)));
    preBar.style.width = prog + '%';
    preCount.textContent = Math.round(prog) + '%';
    if (prog >= 100) { clearInterval(preTick); setTimeout(finishLoading, 200); }
  }, 30);
  function finishLoading() {
    pre.classList.add('is-done');
    document.body.classList.remove('is-loading');
    root.classList.add('is-ready');
    startTyping();
    $$('.hero [data-reveal]').forEach((el, i) => { el.style.setProperty('--d', (i * .08 + .1) + 's'); el.classList.add('is-in'); });
  }

  /* ---------------- Typed Liquid code ---------------- */
  const code = [
    ['{% ', 'k'], ['for ', 'f'], ['product ', 'v'], ['in ', 'k'], ['collection.products', 'v'], [' %}\n', 'k'],
    ['  {% ', 'k'], ['render ', 'f'], ["'card-cro'", 's'], [',\n', ''],
    ['    product: ', ''], ['product', 'v'], [',\n', ''],
    ['    badge: ', ''], ['product.metafields.custom.badge', 'v'], [' %}\n', 'k'],
    ['{% ', 'k'], ['endfor ', 'f'], ['%}', 'k']
  ];
  function startTyping() {
    const el = $('#typedCode');
    if (!el) return;
    if (reduced) { el.innerHTML = code.map(([t, c]) => `<span class="t-${c}">${t}</span>`).join(''); return; }
    let ti = 0, ci = 0, span = null;
    (function step() {
      if (ti >= code.length) {
        setTimeout(() => { el.innerHTML = ''; ti = 0; ci = 0; span = null; step(); }, 4200);
        return;
      }
      const [txt, cls] = code[ti];
      if (!span) { span = document.createElement('span'); if (cls) span.className = 't-' + cls; el.appendChild(span); }
      span.textContent += txt[ci++];
      if (ci >= txt.length) { ti++; ci = 0; span = null; }
      setTimeout(step, 28 + Math.random() * 45);
    })();
  }

  /* ---------------- Hero spotlight ---------------- */
  const hero = $('#hero'), spot = $('.hero__spot');
  if (finePointer && !reduced && spot) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      spot.style.setProperty('--sx', ((e.clientX - r.left) / r.width * 100) + '%');
      spot.style.setProperty('--sy', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  }

  /* ---------------- Custom cursor ---------------- */
  if (finePointer && !reduced) {
    const dot = $('.cursor-dot'), ring = $('.cursor-ring'), label = $('.cursor-ring__label');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    root.classList.add('has-cursor');
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px,${y}px)`; });
    (function loop() {
      rx += (x - rx) * .2; ry += (y - ry) * .2;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', e => {
      const labeled = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a, button, .chip');
      if (labeled) {
        const key = labeled.dataset.cursor;
        label.textContent = (dict[lang].cursor || {})[key] || key;
        ring.classList.add('is-label'); ring.classList.remove('is-hover');
      } else if (hov) {
        ring.classList.add('is-hover'); ring.classList.remove('is-label');
      } else {
        ring.classList.remove('is-hover', 'is-label');
      }
    });
    document.addEventListener('pointerleave', () => { dot.style.opacity = ring.style.opacity = 0; });
    document.addEventListener('pointerenter', () => { dot.style.opacity = ring.style.opacity = ''; });
  }

  /* ---------------- Magnetic + tilt (desktop only) ---------------- */
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach(el => {
      const s = parseFloat(el.dataset.magnetic) || .25;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * s}px, ${(e.clientY - (r.top + r.height / 2)) * s}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    const tilt = (el, max) => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(1000px) rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    };
    $$('[data-tilt]').forEach(el => tilt(el, 10));
    $$('[data-tilt-soft]').forEach(el => tilt(el, 5));
    $$('[data-spotlight]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------------- Reveal / counters / mock animations ---------------- */
  function countUp(el) {
    const end = +el.dataset.count;
    if (reduced) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1600;
    (function f(t) {
      const p = clamp((t - t0) / dur, 0, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      if (el.hasAttribute('data-reveal')) el.classList.add('is-in');
      $$('[data-count]', el).forEach(countUp);
      if (el.id === 'terminal' || el.id === 'dash') el.classList.add('is-run');
      io.unobserve(el);
    });
  }, { threshold: .15, rootMargin: '0px 0px -5% 0px' });
  $$('[data-reveal]:not(.hero [data-reveal]), #terminal, #dash').forEach(el => io.observe(el));

  /* ---------------- Browser slideshows ---------------- */
  $$('[data-slides]').forEach(b => {
    const imgs = $$('.browser__screen img', b), dots = $('.browser__dots', b);
    if (imgs.length < 2) return;
    let i = 0, timer;
    imgs.forEach((_, k) => {
      const d = document.createElement('button');
      d.type = 'button'; d.setAttribute('aria-label', 'Slide ' + (k + 1));
      if (!k) d.classList.add('is-active');
      d.addEventListener('click', () => { go(k); restart(); });
      dots.appendChild(d);
    });
    const ds = $$('button', dots);
    function go(k) {
      imgs[i].classList.remove('is-active'); ds[i].classList.remove('is-active');
      i = k;
      imgs[i].classList.add('is-active'); ds[i].classList.add('is-active');
    }
    function restart() { clearInterval(timer); if (!reduced) timer = setInterval(() => go((i + 1) % imgs.length), 3600); }
    restart();
    // swipe on touch
    let sx = null;
    b.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    b.addEventListener('touchend', e => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) { go((i + (dx < 0 ? 1 : imgs.length - 1)) % imgs.length); restart(); }
      sx = null;
    });
  });

  /* ---------------- Flow toast + checkout cycle ---------------- */
  if (!reduced) {
    const toast = $('#flowToast');
    if (toast) {
      let n = 1042;
      setInterval(() => {
        $('b', toast).textContent = '#' + (++n);
        toast.classList.add('is-bump');
        setTimeout(() => toast.classList.remove('is-bump'), 400);
      }, 2400);
    }
    const checkout = $('#checkout');
    if (checkout) {
      const methods = $$('.method', checkout), status = $('.checkout__status', checkout);
      let m = 0;
      setInterval(() => {
        methods[m].classList.remove('is-on');
        m = (m + 1) % methods.length;
        methods[m].classList.add('is-on');
        status.classList.add('is-bump');
        setTimeout(() => status.classList.remove('is-bump'), 400);
      }, 2200);
    }
  }

  /* ---------------- Scroll: progress, nav, stack, timeline ---------------- */
  const bar = $('.scroll-progress span');
  const nav = $('#nav');
  const projects = $$('.project');
  projects.forEach(p => p.dataset.accent && p.style.setProperty('--accent', p.dataset.accent));
  const tl = $('#timeline'), tlFill = $('#timelineFill');
  const navLinks = $$('#navLinks a');
  const sections = navLinks.map(a => $(a.getAttribute('href')));
  let lastY = scrollY, ticking = false;

  function onScroll() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (!root.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > lastY + 2 && y > 500);
    if (y < lastY - 2) nav.classList.remove('is-hidden');
    lastY = y;

    const stacking = innerWidth > 1024 && innerHeight >= 700 && !reduced;
    projects.forEach((p, i) => {
      const next = projects[i + 1];
      if (!stacking || !next) { p.style.transform = ''; p.style.filter = ''; return; }
      const pr = clamp(1 - (next.getBoundingClientRect().top - 100) / innerHeight, 0, 1);
      p.style.transform = `scale(${1 - pr * .05})`;
      p.style.filter = `brightness(${1 - pr * .4})`;
    });

    if (tl) {
      const r = tl.getBoundingClientRect();
      tlFill.style.height = clamp((innerHeight * .6 - r.top) / r.height, 0, 1) * 100 + '%';
    }

    let active = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .4) active = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-active', i === active));
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------------- Mobile menu ---------------- */
  const burger = $('#burger'), menu = $('#menu');
  function toggleMenu(force) {
    const open = force ?? !root.classList.contains('menu-open');
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) nav.classList.remove('is-hidden');
  }
  burger.addEventListener('click', () => toggleMenu());
  $$('a', menu).forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

  /* ---------------- Copy email ---------------- */
  const mail = $('#copyMail');
  mail.addEventListener('click', async () => {
    const addr = 'devjoseasanchez@gmail.com';
    try { await navigator.clipboard.writeText(addr); }
    catch { location.href = 'mailto:' + addr; return; }
    const lbl = $('#copyLabel');
    mail.classList.add('is-copied');
    lbl.textContent = dict[lang].copied;
    setTimeout(() => { mail.classList.remove('is-copied'); lbl.textContent = dict[lang]['contact.copy']; }, 1800);
  });

  /* ---------------- Clock + year ---------------- */
  const clock = $('#clock');
  const fmt = new Intl.DateTimeFormat('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Caracas' });
  const tick = () => { clock.textContent = fmt.format(new Date()) + ' GMT-4'; };
  tick(); setInterval(tick, 15000);
  $('#year').textContent = new Date().getFullYear();
})();
