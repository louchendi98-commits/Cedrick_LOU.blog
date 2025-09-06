document.addEventListener('DOMContentLoaded', () => {
  // smooth scroll for internal links
  document.querySelectorAll('nav a, .mobile-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        closeMobileNav();
      }
    });
  });

  // mobile menu
  const menuBtn = document.getElementById('menu-toggle');
  const mobileOverlay = document.getElementById('mobile-nav-overlay');
  const mobileClose = document.getElementById('mobile-close');

  function openMobileNav(){
    if (mobileOverlay) {
      mobileOverlay.classList.add('open');
      mobileOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }
  function closeMobileNav(){
    if (mobileOverlay) {
      mobileOverlay.classList.remove('open');
      mobileOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }
  if (menuBtn) menuBtn.addEventListener('click', openMobileNav);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileNav);
  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', (e) => {
      if (e.target === mobileOverlay) closeMobileNav();
    });
  }

  // intersection observer fade-in
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  document.querySelectorAll('section.panel').forEach(s => {
    s.classList.add('fade-in');
    io.observe(s);
  });

  const footer = document.querySelector('footer');
  if (footer) { footer.classList.add('fade-in'); io.observe(footer); }

  // nav highlight
  const navLinks = Array.from(document.querySelectorAll('nav a'));
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href')));
  function updateActive() {
    const offset = window.innerHeight * 0.35;
    let current = sections[0];
    for (let s of sections) {
      if (!s) continue;
      const top = s.getBoundingClientRect().top;
      if (top - offset <= 0) current = s;
    }
    navLinks.forEach(a => a.classList.toggle('active', document.querySelector(a.getAttribute('href')) === current));
  }
  window.addEventListener('scroll', throttle(updateActive, 120));
  updateActive();

  // hero parallax & fade-out
  const heroBg = document.querySelector('.hero-bg');
  const heroContent = document.getElementById('hero-content');
  function onScrollHero() {
    const sc = window.scrollY;
    if (heroBg) {
      heroBg.style.transform = `translateY(${sc * 0.06}px) scale(1.02)`;
      heroBg.style.backgroundPosition = `center ${50 + sc * 0.02}%`;
    }
    if (heroContent) {
      const fadeRange = Math.max(window.innerHeight * 0.6, 200);
      const ratio = Math.min(Math.max(sc / fadeRange, 0), 1);
      heroContent.style.opacity = String(1 - ratio);
      const overlay = document.querySelector('.hero-overlay');
      if (overlay) overlay.style.opacity = String(1 - ratio * 0.85);
    }
  }
  window.addEventListener('scroll', throttle(onScrollHero, 16));
  onScrollHero();

  // throttle helper
  function throttle(fn, wait) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn(...args);
      }
    };
  }
});
