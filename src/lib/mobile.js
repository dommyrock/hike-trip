// ----------------------------------------------------------------------------
//  Phone-only UI, shared by the trail finder and /explore.
// ----------------------------------------------------------------------------
//  - sheet(el)            controller for a BottomSheet.astro dialog: open/close,
//                         Esc + backdrop + ✕ to dismiss, swipe down on the handle,
//                         focus moved in and restored, page scroll locked
//  - relocate(node, into) moves a node into `into` while the phone breakpoint
//                         matches and back to where it was otherwise — the
//                         controls are the SAME elements on both layouts, so
//                         their listeners and values carry over untouched
// ----------------------------------------------------------------------------

// Keep in sync with the 640px breakpoint in global.css.
export const PHONE = window.matchMedia('(max-width: 640px)');

export function sheet(el) {
  const panel = el.querySelector('.sheet-panel');
  const body = el.querySelector('.sheet-body');
  let lastFocus = null;
  let hideTimer;

  function open() {
    clearTimeout(hideTimer);
    if (!el.hidden && el.classList.contains('is-open')) return;
    lastFocus = document.activeElement;
    el.hidden = false;
    document.documentElement.classList.add('sheet-open');
    // next frame so the slide-up transition runs from the hidden state
    requestAnimationFrame(() => el.classList.add('is-open'));
    (el.querySelector('[data-autofocus]') || el.querySelector('.sheet-x'))?.focus({ preventScroll: true });
  }

  function close() {
    if (el.hidden) return;
    el.classList.remove('is-open');
    panel.style.transform = '';
    document.documentElement.classList.remove('sheet-open');
    // hide once the slide-down finishes (0 ms under reduced motion)
    const ms = parseFloat(getComputedStyle(panel).transitionDuration) * 1000 || 0;
    hideTimer = setTimeout(() => (el.hidden = true), ms);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) close();
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // swipe down on the handle / title row to dismiss
  const grip = el.querySelector('.sheet-grip');
  let y0 = null;
  grip.addEventListener(
    'touchstart',
    (e) => {
      y0 = e.touches[0].clientY;
      panel.style.transition = 'none';
    },
    { passive: true }
  );
  grip.addEventListener(
    'touchmove',
    (e) => {
      if (y0 == null) return;
      const dy = Math.max(0, e.touches[0].clientY - y0);
      panel.style.transform = `translateY(${dy}px)`;
    },
    { passive: true }
  );
  grip.addEventListener('touchend', (e) => {
    if (y0 == null) return;
    const dy = e.changedTouches[0].clientY - y0;
    y0 = null;
    panel.style.transition = '';
    if (dy > 80) close();
    else panel.style.transform = '';
  });
  // a cancelled drag (system gesture, incoming call) snaps the panel back
  grip.addEventListener('touchcancel', () => {
    y0 = null;
    panel.style.transition = '';
    panel.style.transform = '';
  });

  // a sheet is a phone-layout thing: leaving the breakpoint closes it
  PHONE.addEventListener('change', () => !PHONE.matches && close());

  return { el, body, open, close };
}

export function relocate(node, into, mq = PHONE) {
  const home = document.createComment(`home of #${node.id}`);
  node.before(home);
  const apply = () => (mq.matches ? into.append(node) : home.after(node));
  mq.addEventListener('change', apply);
  apply();
}
