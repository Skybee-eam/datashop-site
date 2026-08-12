/* =============================================
   DataHub — Ghana's #1 Internet Bundle Shop
   app.js
   ============================================= */

'use strict';

/* ========== GLOBAL SIDEBAR DRAWER ========== */
const globalSidebar = document.getElementById('globalSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const openGlobalSidebar = document.getElementById('openGlobalSidebar');
const closeGlobalSidebar = document.getElementById('closeGlobalSidebar');

function toggleGlobalSidebar(open) {
  if (globalSidebar) globalSidebar.classList.toggle('open', open);
  if (sidebarOverlay) sidebarOverlay.classList.toggle('active', open);
}

if (openGlobalSidebar) {
  openGlobalSidebar.addEventListener('click', () => toggleGlobalSidebar(true));
}
if (closeGlobalSidebar) {
  closeGlobalSidebar.addEventListener('click', () => toggleGlobalSidebar(false));
}
if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', () => toggleGlobalSidebar(false));
}

/* ========== THEME TOGGLE ========== */
const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'dark';

if (currentTheme === 'light') {
  if (themeToggle) themeToggle.textContent = '🌙';
} else {
  if (themeToggle) themeToggle.textContent = '☀️';
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
      themeToggle.textContent = '☀️';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      themeToggle.textContent = '🌙';
    }
  });
}

/* ========== CURSOR GLOW ========== */
const cursorGlow = document.getElementById('cursorGlow');
document.addEventListener('mousemove', e => {
  if (cursorGlow) {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top  = e.clientY + 'px';
  }
});

/* ========== PARTICLE CANVAS ========== */
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['rgba(0,210,255,', 'rgba(123,47,255,', 'rgba(16,185,129,', 'rgba(245,158,11,'];
  function mkParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.5 + 0.15,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
  }

  for (let i = 0; i < 120; i++) particles.push(mkParticle());

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > W) p.dx *= -1;
      if (p.y < 0 || p.y > H) p.dy *= -1;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ========== NAVBAR SCROLL ========== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

/* ========== MOBILE HAMBURGER ========== */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('open');
  });
  // Close on nav link click
  navLinks.querySelectorAll('.nav-link').forEach(l => {
    l.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });
}

/* ========== NETWORK SELECTION (hero pills) ========== */
function selectNetwork(net) {
  document.querySelectorAll('.network-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.net === net);
  });
  // Also sync the bundle tabs
  switchTab(net);
}

/* ========== NETWORK CARDS → scroll to bundles ========== */
function selectNetworkAndScroll(net) {
  selectNetwork(net);
  document.getElementById('bundles').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ========== BUNDLE TABS ========== */
function switchTab(net) {
  document.querySelectorAll('.bundle-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.net === net);
  });
  document.querySelectorAll('.bundle-panel').forEach(p => {
    p.classList.toggle('active', p.id === 'panel-' + net);
  });
}

// Bind tabs
document.querySelectorAll('.bundle-tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.net));
});

/* ========== PURCHASE FLOW ========== */
let currentBundle = null;

function buyBundle(btn, network, size, price) {
  // Store intent in localStorage so it can be restored after login
  localStorage.setItem('pendingBundle', JSON.stringify({ network, size, price }));
  window.location.href = 'login.html';
}

function closePurchaseForm() {
  const form = document.getElementById('purchaseForm');
  if (form) form.style.display = 'none';
  currentBundle = null;
}

function confirmPurchase() {
  const phone = document.getElementById('phoneInput').value.trim();
  if (!phone || phone.length < 10) {
    showToast('error', 'Please enter a valid phone number');
    document.getElementById('phoneInput').focus();
    return;
  }
  if (!currentBundle) return;

  const btn = document.querySelector('.btn-confirm');
  btn.disabled = true;
  btn.textContent = 'Processing\u2026';

  setTimeout(() => {
    const masked = phone.slice(0, 4) + '****' + phone.slice(-3);
    showToast('success', '\u26A1 ' + currentBundle.size + ' sent to ' + masked + ' \u2014 Delivered!');
    addLiveFeedItem(currentBundle.network, currentBundle.size, masked);
    closePurchaseForm();
    document.getElementById('phoneInput').value = '';
    btn.disabled = false;
    btn.textContent = '\uD83D\uDE80 Confirm & Pay';
  }, 1400);
}

/* Payment option toggle */
document.querySelectorAll('.pay-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
  });
});

/* ========== LIVE FEED ========== */
const liveData = [
  { net: 'MTN',    cls: 'mtn',    size: '1GB',   phone: '0803***456' },
  { net: 'AirtelTigo', cls: 'airteltigo', size: '3GB',   phone: '0812***789' },
  { net: 'Glo',    cls: 'glo',    size: '5GB',   phone: '0805***321' },
  { net: 'Telecel',cls: 'telecel',     size: '1GB',   phone: '0909***654' },
  { net: 'MTN',    cls: 'mtn',    size: '10GB',  phone: '0701***112' },
  { net: 'AirtelTigo', cls: 'airteltigo', size: '10GB',  phone: '0818***907' },
  { net: 'Glo',    cls: 'glo',    size: '10GB',  phone: '0811***224' },
  { net: 'MTN',    cls: 'mtn',    size: '20GB',  phone: '0704***887' },
  { net: 'Telecel',cls: 'telecel',     size: '2.5GB', phone: '0906***541' },
  { net: 'MTN',    cls: 'mtn',    size: '2GB',   phone: '0803***192' },
  { net: 'AirtelTigo', cls: 'airteltigo', size: '5GB',   phone: '0816***366' },
  { net: 'Glo',    cls: 'glo',    size: '2GB',   phone: '0805***799' },
];
let liveIdx = 0;

function addLiveFeedItem(network, size, phone) {
  const feed = document.getElementById('liveFeed');
  if (!feed) return;
  const cls = network === 'MTN' ? 'mtn' : network === 'AirtelTigo' ? 'airteltigo' : network === 'Glo' ? 'glo' : 'telecel';
  const now  = new Date();
  const time = now.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });
  const el = document.createElement('div');
  el.className = 'live-item';
  el.innerHTML = `<span class="live-net ${cls}">${network}</span><span class="live-info">${size} data sent to ${phone}</span><span class="live-time">${time}</span><span class="live-status">\u2713 Delivered</span>`;
  feed.prepend(el);
  // Keep max 4 items visible
  while (feed.children.length > 4) feed.lastChild.remove();
}

function startLiveFeedRotation() {
  const feed = document.getElementById('liveFeed');
  if (!feed) return;
  // Seed initial items
  for (let i = 0; i < 4; i++) {
    const d = liveData[(liveIdx++) % liveData.length];
    const mins = (4 - i) + Math.floor(Math.random() * 3);
    const el = document.createElement('div');
    el.className = 'live-item';
    el.innerHTML = `<span class="live-net ${d.cls}">${d.net}</span><span class="live-info">${d.size} data sent to ${d.phone}</span><span class="live-time">${mins}m ago</span><span class="live-status">\u2713 Delivered</span>`;
    feed.appendChild(el);
  }
  // Auto-update
  setInterval(() => {
    const d = liveData[(liveIdx++) % liveData.length];
    const now = new Date();
    const time = now.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });
    const el = document.createElement('div');
    el.className = 'live-item';
    el.innerHTML = `<span class="live-net ${d.cls}">${d.net}</span><span class="live-info">${d.size} data sent to ${d.phone}</span><span class="live-time">${time}</span><span class="live-status">\u2713 Delivered</span>`;
    feed.prepend(el);
    while (feed.children.length > 4) feed.lastChild.remove();
  }, 3800);
}

/* ========== STAT COUNTER ANIMATION ========== */
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1600;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(ease * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/* ========== TOAST ========== */
let toastTimeout;
function showToast(type, msg) {
  const toast   = document.getElementById('toast');
  const toastMsg  = document.getElementById('toastMsg');
  const toastIcon = document.getElementById('toastIcon');
  if (!toast) return;

  toastMsg.textContent  = msg;
  toastIcon.textContent = type === 'success' ? '\u26A1' : '\u26A0\uFE0F';
  toast.style.borderColor = type === 'success' ? 'rgba(0,210,255,0.4)' : 'rgba(239,68,68,0.4)';

  clearTimeout(toastTimeout);
  toast.classList.add('show');
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ========== SCROLL REVEAL ========== */
(function initReveal() {
  const targets = document.querySelectorAll(
    '.network-card, .bundle-card, .step-card, .price-card, .testimonial-card, .trust-badge, .hero-stats .stat-item'
  );
  targets.forEach((el, i) => {
    el.setAttribute('data-reveal', '');
    el.style.transitionDelay = (i * 0.04) + 's';
  });

  let countersDone = false;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
    // Trigger counter animation when hero stats are in view
    if (!countersDone) {
      const statsVisible = document.querySelector('.stat-num.revealed') ||
        document.querySelector('[data-reveal].revealed .stat-num');
      if (statsVisible) { animateCounters(); countersDone = true; }
    }
  }, { threshold: 0.15 });

  targets.forEach(el => io.observe(el));

  // Trigger counters when hero section is visible (on load)
  const heroIO = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !countersDone) {
      animateCounters();
      countersDone = true;
      heroIO.disconnect();
    }
  }, { threshold: 0.3 });
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) heroIO.observe(heroStats);
})();

/* ========== ACTIVE NAV LINK ON SCROLL ========== */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-link');
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => {
          l.style.color = l.getAttribute('href') === '#' + entry.target.id
            ? 'var(--text)' : '';
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => io.observe(s));
})();

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', () => {
  startLiveFeedRotation();
});
