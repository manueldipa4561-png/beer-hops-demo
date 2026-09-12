const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const $ = (selector, scope = document) => scope.querySelector(selector);

// Reveal on scroll
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14, rootMargin: '0px 0px -40px' });

$$('.reveal').forEach((el, index) => {
  el.style.transitionDelay = `${Math.min(index % 4, 3) * 45}ms`;
  revealObserver.observe(el);
});

// Mobile navigation
const menuToggle = $('.menu-toggle');
const mainNav = $('.main-nav');

function closeMenu() {
  menuToggle?.classList.remove('open');
  mainNav?.classList.remove('open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

menuToggle?.addEventListener('click', () => {
  const open = !mainNav.classList.contains('open');
  menuToggle.classList.toggle('open', open);
  mainNav.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});

$$('.main-nav a').forEach((link) => link.addEventListener('click', closeMenu));

// Beer country filters
const filterButtons = $$('.filter');
const beerRows = $$('.beer-row');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.filter;

    beerRows.forEach((row) => {
      const show = filter === 'all' || row.dataset.country === filter;
      row.classList.toggle('hidden', !show);
    });
  });
});

// Current opening status in Europe/Rome.
// Beer Hops public opening hours: Tue-Sun 18:00-01:00, Monday closed.
function getRomeParts() {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function updateOpenStatus() {
  const pill = $('#open-status');
  if (!pill) return;

  const now = getRomeParts();
  const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
  const day = dayMap[now.weekday];
  const minutes = Number(now.hour) * 60 + Number(now.minute);
  const eveningOpen = day !== 1 && minutes >= 18 * 60;
  const afterMidnightOpen = minutes < 60 && day !== 2; // Tue 00:xx belongs to Monday closure.
  const isOpen = eveningOpen || afterMidnightOpen;

  pill.textContent = isOpen ? 'APERTO ORA' : 'CHIUSO ORA';
  pill.style.color = isOpen ? 'var(--lime)' : '#a7aca2';
  pill.style.borderColor = isOpen ? 'rgba(201,243,90,.23)' : 'rgba(255,255,255,.12)';
  pill.style.background = isOpen ? 'rgba(201,243,90,.11)' : 'rgba(255,255,255,.05)';
}

updateOpenStatus();
setInterval(updateOpenStatus, 60_000);

// Soft cursor glow on desktop
const glow = $('.cursor-glow');
if (glow && window.matchMedia('(pointer:fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  }, { passive: true });
}

// Lightweight magnetic hover on selected CTA elements
if (window.matchMedia('(pointer:fine)').matches) {
  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });
}

// Parallax the hero visual very slightly, avoiding heavy animation libraries.
const heroVisual = $('.hero-visual');
if (heroVisual && window.matchMedia('(min-width: 761px)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.addEventListener('scroll', () => {
    const offset = Math.min(window.scrollY * 0.07, 45);
    heroVisual.style.translate = `0 ${offset}px`;
  }, { passive: true });
}

$('#year').textContent = new Date().getFullYear();
