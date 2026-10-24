/* Cookie-free, aggregate attention measurement. No visitor IDs or input content. */
(function () {
  'use strict';
  const host = /^(www\.)?kushpatel29\.github\.io$/;
  const params = new URLSearchParams(location.search);
  let optedOut = false;
  try { optedOut = localStorage.getItem('portfolio_tracking_disabled') === '1'; } catch {}
  if (!host.test(location.hostname) || navigator.webdriver || navigator.doNotTrack === '1' || navigator.globalPrivacyControl || optedOut || params.get('analytics') === 'off') return;
  const qa = params.get('analytics_test') === '1';
  const areas = Array.from(document.querySelectorAll('main section[id], article.project[id]'));
  const pending = new Map();
  let lastActivity = Date.now();
  let lastTick = performance.now();
  const safeReferrer = (() => { try { return document.referrer ? new URL(document.referrer).origin : ''; } catch { return ''; } })();
  window.goatcounter = {
    path: location.pathname,
    referrer: safeReferrer,
    ...(qa ? { no_onload: true } : {})
  };
  function count(path, title, repeated = false) {
    if (typeof window.goatcounter?.count !== 'function') return false;
    window.goatcounter.count({ path: (qa ? 'qa:' : '') + path, title, event: true, no_session: repeated, referrer: '' });
    return true;
  }
  ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'].forEach(name => {
    window.addEventListener(name, () => { lastActivity = Date.now(); }, { passive: true });
  });
  function currentArea() {
    const center = Math.min(innerHeight * .45, 400);
    // A visible project is more useful than its parent Projects section.
    const visible = areas.filter(node => {
      const r = node.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top <= center && r.bottom > center;
    });
    return visible.find(node => node.matches('article.project')) || visible.at(-1);
  }
  setInterval(() => {
    const now = performance.now();
    const elapsed = Math.min(Math.max(now - lastTick, 0), 2000);
    lastTick = now;
    const videoPlaying = Array.from(document.querySelectorAll('video')).some(v => !v.paused && !v.ended);
    if (document.visibilityState !== 'visible' || !document.hasFocus() || (!videoPlaying && Date.now() - lastActivity > 60000)) return;
    const node = currentArea();
    if (!node) return;
    const id = node.id;
    const time = (pending.get(id) || 0) + elapsed;
    if (time >= 15000 && count('pi-time-15s:' + id, 'Attention · ' + id + ' · 15 seconds', true)) {
      pending.set(id, time - 15000);
    } else pending.set(id, time);
  }, 1000);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const project = link.closest('article.project[id]');
    if (project) count('pi-project-click:' + project.id, 'Project link · ' + project.id);
    const href = link.getAttribute('href');
    if (/Kush-Patel-Resume.*\.pdf/.test(href)) count('pi-action:resume', 'Résumé opened');
    else if (href.startsWith('mailto:')) count('pi-action:contact', 'Email link clicked');
  });
  if (qa) {
    const retry = setInterval(() => { if (count('pi-qa-page', 'Analytics integration test')) clearInterval(retry); }, 250);
    setTimeout(() => clearInterval(retry), 30000);
  }
})();
