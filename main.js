/* Kush Patel — portfolio interactions. No dependencies. */
(function () {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme toggle (persisted, defaults to system) ---------- */
  const root = document.documentElement;
  const urlTheme = new URLSearchParams(location.search).get("theme");
  const stored = urlTheme || localStorage.getItem("theme");
  if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    root.setAttribute("data-theme", "dark");
  }
  document.getElementById("theme-toggle").addEventListener("click", function () {
    const dark = root.getAttribute("data-theme") === "dark";
    if (dark) root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", dark ? "light" : "dark");
  });

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- stat count-up ---------- */
  const stats = document.querySelectorAll(".stat-n");
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    if (reduced) { el.textContent = target + suffix; return; }
    const dur = 900;
    const t0 = performance.now();
    function tick(t) {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window && !reduced) {
    const so = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { animateCount(e.target); so.unobserve(e.target); }
        });
      },
      { threshold: 0.6 }
    );
    stats.forEach((el) => so.observe(el));
  } else {
    stats.forEach((el) => { el.textContent = el.dataset.count + (el.dataset.suffix || ""); });
  }

  /* ---------- hero terminal typing ---------- */
  const typedEl = document.getElementById("typed");
  const output = document.getElementById("t-output");
  const caret = document.getElementById("caret");
  const cmd = 'ask "which payer type collects the least of what it bills?"';
  if (reduced) {
    typedEl.textContent = cmd;
    output.hidden = false;
  } else {
    let started = false;
    const to = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started) {
          started = true;
          to.disconnect();
          let i = 0;
          (function type() {
            if (i <= cmd.length) {
              typedEl.textContent = cmd.slice(0, i);
              i += 1;
              setTimeout(type, 26);
            } else {
              setTimeout(() => {
                output.hidden = false;
                caret.style.display = "none";
              }, 350);
            }
          })();
        }
      });
    }, { threshold: 0.4 });
    to.observe(typedEl.closest(".terminal"));
  }

  /* ---------- footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
