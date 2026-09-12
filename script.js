const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const $ = (selector, scope = document) => scope.querySelector(selector);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Progressive reveal animations.
if ('IntersectionObserver' in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px' });

  $$('.reveal').forEach((el, index) => {
    el.style.transitionDelay = `${Math.min(index % 3, 2) * 55}ms`;
    revealObserver.observe(el);
  });
} else {
  $$('.reveal').forEach((el) => el.classList.add('visible'));
}

// Header state.
const header = $('.site-header');
const syncHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

// Mobile navigation.
const menuToggle = $('.menu-toggle');
const mainNav = $('.main-nav');

function closeMenu() {
  menuToggle?.classList.remove('open');
  mainNav?.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', 'Apri menu');
  document.body.style.overflow = '';
}

menuToggle?.addEventListener('click', () => {
  const open = !mainNav?.classList.contains('open');
  menuToggle.classList.toggle('open', open);
  mainNav?.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
  document.body.style.overflow = open ? 'hidden' : '';
});

$$('.main-nav a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

// Beer country filters.
const filterButtons = $$('.filter');
const beerCards = $$('.beer-card');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((btn) => {
      const active = btn === button;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    beerCards.forEach((card) => {
      const show = filter === 'all' || card.dataset.country === filter;
      card.classList.toggle('hidden', !show);
    });
  });
});

// Current opening status in Europe/Rome.
// Verified repository hours: Mon closed; Tue-Sun 18:00-01:00.
function getRomeParts() {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return Object.fromEntries(formatter.formatToParts(new Date()).map(({ type, value }) => [type, value]));
}

function updateOpenStatus() {
  const pill = $('#open-status');
  if (!pill) return;

  const now = getRomeParts();
  const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
  const day = dayMap[now.weekday];
  const minutes = Number(now.hour) * 60 + Number(now.minute);
  const eveningOpen = day !== 1 && minutes >= 18 * 60;
  const afterMidnightOpen = minutes < 60 && day !== 2;
  const isOpen = eveningOpen || afterMidnightOpen;

  pill.textContent = isOpen ? 'APERTO ORA' : 'CHIUSO ORA';
  pill.style.color = isOpen ? '#4d7015' : 'rgba(16,19,14,.55)';
  pill.style.borderColor = isOpen ? 'rgba(77,112,21,.28)' : 'rgba(16,19,14,.14)';
  pill.style.background = isOpen ? 'rgba(168,213,74,.2)' : 'rgba(16,19,14,.04)';
}

updateOpenStatus();
setInterval(updateOpenStatus, 60_000);

// Desktop-only cursor glow and lightweight magnetic CTA effect.
const finePointer = window.matchMedia('(pointer:fine)').matches;
const glow = $('.cursor-glow');
if (glow && finePointer && !reducedMotion) {
  window.addEventListener('pointermove', (event) => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  }, { passive: true });
}

if (finePointer && !reducedMotion) {
  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.07}px, ${y * 0.07}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

// Subtle parallax without an animation library.
const heroMedia = $('.hero-media');
const photoBreakMedia = $('.photo-break-media');
let ticking = false;

function applyParallax() {
  ticking = false;
  if (reducedMotion || window.innerWidth < 760) return;

  const y = window.scrollY;
  if (heroMedia) heroMedia.style.transform = `scale(1.04) translate3d(0, ${Math.min(y * 0.055, 42)}px, 0)`;

  if (photoBreakMedia) {
    const rect = photoBreakMedia.parentElement.getBoundingClientRect();
    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    const offset = (progress - 0.5) * 58;
    photoBreakMedia.style.transform = `translate3d(0, ${offset}px, 0)`;
  }
}

function requestParallax() {
  if (!ticking) {
    requestAnimationFrame(applyParallax);
    ticking = true;
  }
}

if (!reducedMotion) {
  applyParallax();
  window.addEventListener('scroll', requestParallax, { passive: true });
  window.addEventListener('resize', requestParallax, { passive: true });
}

const year = $('#year');
if (year) year.textContent = new Date().getFullYear();
