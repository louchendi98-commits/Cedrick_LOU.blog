// welcome.js — 精简中文版欢迎页（打字 + 删除），下箭头点击或向下滚动/按键/上滑触发跳转
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('welcomeRoot');
  const typedEl = document.getElementById('typed');
  const downArrow = document.getElementById('downArrow');
  const enBtn = document.getElementById('enBtn');
  const centerWrap = document.getElementById('centerWrap');

  // typing sequence (中文)
  const sequence = [
    { type: '我是 一个在读博士', waitAfter: 900 },
    { deleteTo: '我是 ', waitAfter: 600 },
    { type: '一个乾饭人', waitAfter: 900 },
    { deleteCount: 'auto', waitAfter: 480 },
    { type: '我是 楼晨笛，你好👋', waitAfter: 1400 }
  ];

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function runSequence(seq) {
    typedEl.textContent = '';
    for (let step of seq) {
      if (step.type !== undefined) {
        await typeText(step.type, 68, 24);
        if (step.waitAfter) await sleep(step.waitAfter);
      } else if (step.deleteTo !== undefined) {
        await deleteToText(step.deleteTo, 46);
        if (step.waitAfter) await sleep(step.waitAfter);
      } else if (step.deleteCount === 'auto') {
        await deleteAll(44);
        if (step.waitAfter) await sleep(step.waitAfter);
      }
    }
  }

  async function typeText(text, speed = 80, variance = 30) {
    for (let i = 0; i < text.length; i++) {
      typedEl.textContent += text[i];
      await sleep(speed + Math.random() * variance);
    }
  }
  async function deleteAll(speed = 45) {
    while (typedEl.textContent.length > 0) {
      typedEl.textContent = typedEl.textContent.slice(0, -1);
      await sleep(speed + Math.random() * 12);
    }
  }
  async function deleteToText(target, speed = 45) {
    if (!typedEl.textContent.startsWith(target)) {
      await deleteAll(speed);
      return;
    }
    while (typedEl.textContent !== target) {
      typedEl.textContent = typedEl.textContent.slice(0, -1);
      await sleep(speed + Math.random() * 10);
    }
  }

  // start once
  runSequence(sequence).catch(console.error);

  // navigation with fadeout (only once)
  let navigating = false;
  function navigateTo(url) {
    if (navigating) return;
    navigating = true;
    try { localStorage.setItem('preferredLang', url.includes('lang=en') ? 'en' : 'zh'); } catch (e) {}
    root.classList.add('fadeout');
    setTimeout(() => { window.location.href = url; }, 640);
  }

  // arrow click
  downArrow.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateTo('index.html?lang=zh');
  });

  // EN click
  enBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateTo('index.html?lang=en');
  });

  // click ripple effect (visual only)
  document.addEventListener('click', (e) => {
    // do not block button default; ripple everywhere
    const x = e.clientX, y = e.clientY;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    document.body.appendChild(ripple);
    // remove after animation
    setTimeout(() => ripple.remove(), 780);
  });

  // scroll / wheel -> downward intention triggers navigation
  let wheelTimeout = null;
  function onWheel(e) {
    if (navigating) return;
    // positive deltaY means scroll down
    if (e.deltaY > 20) navigateTo('index.html?lang=zh');
    // throttle not to double-call
    if (wheelTimeout) clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => { wheelTimeout = null; }, 300);
  }
  window.addEventListener('wheel', onWheel, { passive: true });

  // keyboard: ArrowDown / PageDown / Space triggers
  document.addEventListener('keydown', (e) => {
    if (navigating) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.code === 'Space') {
      // if focus is in an input, skip, otherwise navigate
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
      e.preventDefault && e.preventDefault();
      navigateTo('index.html?lang=zh');
    }
  });

  // touch: detect upward swipe (finger moves up => intent to go down)
  let touchStartY = null;
  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length) touchStartY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (navigating || touchStartY === null) { touchStartY = null; return; }
    const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : null;
    if (endY !== null && touchStartY - endY > 60) {
      // upward swipe (finger moved up) -> navigate (user swiped up to go down)
      navigateTo('index.html?lang=zh');
    }
    touchStartY = null;
  }, { passive: true });

  // accessibility: centerWrap click also goes to homepage (but we decided only arrow/scroll => user asked arrow or scroll, but keep center-click optional)
  centerWrap.addEventListener('click', () => {
    // just show ripple and no navigation unless user uses arrow/scroll or clicks arrow
    // we will NOT navigate on center click to avoid accidental redirects
  });

  // defensive: remove listeners when navigating out
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('wheel', onWheel);
  });
});
