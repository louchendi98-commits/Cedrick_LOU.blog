/* click-effects.js
   全站点击特效（ripple + fireworks）
   使用说明：
     - 在 index.html 的 <head> 或 <body> 底部引入：
         <link rel="stylesheet" href="css/click-effects.css">
         <script defer src="js/click-effects.js"></script>
     - 在本文件顶部配置 `CONFIG` 控制是启用哪种效果。
     - Fireworks 在小屏幕（触摸设备 / 宽度 < 768px）默认禁用以节省性能。
*/

(() => {
  // ---------- 配置 ----------
  const CONFIG = {
    enableRipple: true,          // 是否启用波纹
    enableFireworks: true,       // 是否启用礼花（canvas）
    fireworksOnDesktopOnly: true,// 是否只在桌面启用礼花（宽度 >= minWidthForFireworks）
    minWidthForFireworks: 768,   // 小于这个宽度将禁用礼花（移动端）
    maxFireworksPerSecond: 4,    // 每秒最大触发次数（节流）
    fireworksParticleCount: 24,  // 每次礼花粒子数量（控制视觉/性能）
    fireworksParticleSize: [2, 5], // 粒子尺寸范围 px
    rippleColor: 'rgba(255,255,255,0.12)', // 波纹颜色（可修改为深色）
    autoEnableOnBodyClicks: true  // 是否把特效注册到 document.body 的点击/指针事件
  };

  // ---------- 工具 ----------
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const canFireworks = () => {
    if (!CONFIG.enableFireworks) return false;
    if (CONFIG.fireworksOnDesktopOnly && window.innerWidth < CONFIG.minWidthForFireworks) return false;
    if (isTouch) return false;
    return true;
  };

  // ---------- Ripple 实现 ----------
  function createRipple(x, y, opts = {}) {
    if (!CONFIG.enableRipple) return;
    const ripple = document.createElement('span');
    ripple.className = 'ce-ripple';
    const size = opts.size || Math.max(window.innerWidth, window.innerHeight) * 0.06;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.background = opts.color || CONFIG.rippleColor;
    ripple.style.opacity = '0.98';
    document.body.appendChild(ripple);
    // 清理
    setTimeout(() => {
      ripple.remove();
    }, 760);
  }

  // ---------- Fireworks（canvas）实现 ----------
  let canvas, ctx, particles = [], rafId = null;
  let lastFireworksAt = 0;
  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.className = 'ce-fireworks-canvas';
    canvas.style.position = 'fixed';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

  function spawnFirework(x, y) {
    if (!canFireworks()) return;
    const now = Date.now();
    const elapsed = now - lastFireworksAt;
    if (elapsed < 1000 / CONFIG.maxFireworksPerSecond) return; // 节流
    lastFireworksAt = now;

    ensureCanvas();

    const baseHue = 200 + Math.round(Math.random() * 40); // 石板蓝系偏色
    const count = CONFIG.fireworksParticleCount;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 3.6;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = CONFIG.fireworksParticleSize[0] + Math.random() * (CONFIG.fireworksParticleSize[1] - CONFIG.fireworksParticleSize[0]);
      const life = 600 + Math.random() * 700; // 毫秒
      const hue = baseHue + (Math.random() * 40 - 20);
      const sat = 50 + Math.random() * 30;
      const light = 55 + Math.random() * 12;
      const color = `hsl(${hue}deg ${sat}% ${light}%)`;
      particles.push({
        x, y, vx, vy, size, life, born: now, color, alpha: 1,
        friction: 0.995 + Math.random() * 0.003,
        gravity: 0.02 + Math.random() * 0.05,
      });
    }
    if (!rafId) loop();
  }

  function loop() {
    if (!canvas) return;
    const now = Date.now();
    // clear with slight alpha for motion blur effect
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const age = now - p.born;
      if (age > p.life || p.size <= 0.2 || p.alpha <= 0.02) {
        particles.splice(i, 1);
        continue;
      }
      // physics
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.x += p.vx;
      p.y += p.vy;
      // fade out
      p.alpha = 1 - age / p.life;
      // draw
      ctx.beginPath();
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 6);
      g.addColorStop(0, p.color.replace(')', ` / ${Math.min(1, p.alpha.toFixed(2))})`).replace('hsl', 'hsl'));
      // fallback if above fails (some browsers require commas)
      // but we try to use modern CSS color format
      try {
        ctx.fillStyle = g;
      } catch (_e) {
        ctx.fillStyle = p.color;
      }
      ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
    }

    if (particles.length > 0) {
      rafId = requestAnimationFrame(loop);
    } else {
      rafId = null;
      // optionally clear canvas fully
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // ---------- 事件注册 ----------
  function onPointer(e) {
    const isTouchEvent = e.pointerType === 'touch' || e.type === 'touchstart';
    // prefer clientX/clientY; fallback to touches
    const x = (e.clientX !== undefined) ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
    const y = (e.clientY !== undefined) ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY) || 0;

    // ripple always (unless disabled)
    if (CONFIG.enableRipple) {
      createRipple(x, y, { color: CONFIG.rippleColor });
    }

    // fireworks on desktop only / when enabled
    if (canFireworks()) {
      spawnFirework(x, y);
    }
  }

  // Prefer pointerdown for unified mouse/touch/pen handling; fallback to click if not supported
  const addListener = (element, type, handler) => {
    try {
      element.addEventListener(type, handler, { passive: true, capture: false });
    } catch (e) {
      element.addEventListener(type, handler);
    }
  };

  // Register on document (or body)
  if (CONFIG.autoEnableOnBodyClicks) {
    if (window.PointerEvent) {
      addListener(document, 'pointerdown', onPointer);
    } else {
      addListener(document, 'click', onPointer);
      // also support touchstart for quicker reaction
      addListener(document, 'touchstart', onPointer);
    }
  }

  // expose a small API on window for manual control
  window.ClickEffects = {
    createRippleAt: (x, y, opts = {}) => createRipple(x, y, opts),
    spawnFireworkAt: (x, y) => spawnFirework(x, y),
    setConfig: (newCfg) => Object.assign(CONFIG, newCfg),
    isFireworksEnabled: canFireworks
  };
})();
