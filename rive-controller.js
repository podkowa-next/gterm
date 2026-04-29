/**
 * Rive Animation Controller
 * Reads the Rive file URL from the 'data-rive-url' attribute on the #rive element.
 */

function initRiveController() {
  const canvas = document.getElementById('rive');
  
  // Safety check: if we are on a page without the canvas, stop immediately.
  if (!canvas) return;

  // 1. GET URL FROM DATA ATTRIBUTE
  const srcUrl = canvas.getAttribute('data-rive-url');
  
  if (!srcUrl) {
    console.warn('⚠️ Rive Canvas found, but "data-rive-url" is missing.');
    return;
  }

  // 2. YOUR ORIGINAL LOGIC
  const STATE_MACHINES = ['State Machine 1'];
  const RIVE_CURSOR_PROPERTY = 'is_pointer'; 
  let tooltipVMi = null;
  let hoverCount = 0;
  let ttDict = {};

  function buildTtDict() {
    const root =
      document.querySelector('[data-tt-dict="1"]') ||
      document.querySelector('.tt-dict') ||
      document;

    const nodes = root.querySelectorAll('[data-tt-id]');
    const next = {};

    nodes.forEach(el => {
      const id = (el.getAttribute('data-tt-id') || '').trim();
      const txtEl = el.querySelector('[data-tt-text]') || el;
      const text = (txtEl.textContent || '').trim();
      if (id && text) next[id] = text;
    });

    ttDict = next;
    return Object.keys(ttDict).length;
  }

  // Tooltip dictionary poller
  buildTtDict();
  let ttDictTries = 0;
  const ttDictMaxTries = 20;
  const ttDictTimer = setInterval(() => {
    ttDictTries++;
    const count = buildTtDict();
    if (count > 0 || ttDictTries >= ttDictMaxTries) {
      clearInterval(ttDictTimer);
    }
  }, 250);

  function scrollToHash(hash) {
    const target = document.getElementById(hash);
    if (target) {
      const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    } else {
      location.hash = '#' + hash;
    }
  }

  function handleRiveEvent(ev) {
    const data = ev?.data || {};
    const name = data.name || '';
    const url  = data.url  || '';

    if (name === 'hover_on')  { hoverCount++; return; }
    if (name === 'hover_off') { hoverCount = Math.max(0, hoverCount - 1); return; }

    if (name === 'bookDemo') { scrollToHash('bookDemo'); return; }
    if (url && url.includes('#')) {
      scrollToHash(url.slice(url.indexOf('#') + 1));
      return;
    }
  }

  // Initialize Rive
  const r = new rive.Rive({
    src: srcUrl,
    canvas,
    stateMachines: STATE_MACHINES,
    autoplay: true,
    isTouchScrollEnabled: true,
    autoBind: true, 
    layout: new rive.Layout({ fit: rive.Fit.Cover, alignment: rive.Alignment.Center }),

    onLoad: () => {
      r.resizeDrawingSurfaceToCanvas();
      setTimeout(() => {
        tooltipVMi = r.viewModelInstance;
        if (tooltipVMi) {
          // console.log('✅ View Model connected');
          try { tooltipVMi.boolean('tt_visible').value = false; } catch {}

          let lastKeySeen = null;
          let lastVis = null;
          let lastCursorStyle = 'default'; 

          const tick = () => {
            try {
              if (tooltipVMi) {
                const visProp = tooltipVMi.boolean('tt_visible');
                const txtProp = tooltipVMi.string('tt_text');
                const isVisible = visProp ? !!visProp.value : false;
                const keyRaw = txtProp ? (txtProp.value || '') : '';
                const key = (keyRaw || '').trim();

                if (isVisible) {
                  if (key && key !== lastKeySeen) {
                    const cms = ttDict[key];
                    txtProp.value = (cms && cms.trim()) 
                      ? cms.trim() 
                      : `Missing description for: ${key}`;
                    lastKeySeen = (txtProp.value || '').trim();
                  }
                } else {
                  if (lastVis !== isVisible) lastKeySeen = null;
                }
                lastVis = isVisible;

                let vmWantsPointer = false;
                try {
                    const ptrProp = tooltipVMi.boolean(RIVE_CURSOR_PROPERTY);
                    if (ptrProp) vmWantsPointer = ptrProp.value;
                } catch(err) {}

                const desiredCursor = (hoverCount > 0 || vmWantsPointer) ? 'pointer' : 'default';

                if (desiredCursor !== lastCursorStyle) {
                    canvas.style.cursor = desiredCursor;
                    lastCursorStyle = desiredCursor;
                }
              }
            } catch (e) {}
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      }, 50);
    },
    onEvent: handleRiveEvent
  });

  if (r.on && rive.EventType?.RiveEvent) {
    r.on(rive.EventType.RiveEvent, handleRiveEvent);
  }

  const resize = () => r.resizeDrawingSurfaceToCanvas();
  window.addEventListener('resize', resize);
  
  const mql = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  if (mql.addEventListener) mql.addEventListener('change', resize);
  else if (mql.addListener) mql.addListener(resize);
}

// 3. WAIT FOR EXTERNAL LIBRARY (The "Safety Check")
// This ensures that even if main-loader.js loads things fast, we don't crash
// if the Rive library isn't fully ready in the window object yet.
const riveLibCheck = setInterval(() => {
    if (typeof rive !== 'undefined') {
        clearInterval(riveLibCheck);
        initRiveController();
    }
}, 50);