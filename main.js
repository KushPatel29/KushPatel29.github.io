/* ============================================================
   Kush Patel — portfolio interactions. Zero dependencies.
   Everything motion-related respects prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- theme (URL override > stored > system) ---------- */
  const root = document.documentElement;
  const urlTheme = new URLSearchParams(location.search).get("theme");
  const stored = urlTheme || localStorage.getItem("theme");
  if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    root.setAttribute("data-theme", "dark");
  }
  function toggleTheme() {
    const dark = root.getAttribute("data-theme") === "dark";
    if (dark) root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", dark ? "light" : "dark");
  }
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

  /* ---------- scroll progress bar ---------- */
  const bar = document.createElement("div");
  bar.id = "progress";
  document.body.appendChild(bar);
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
      ticking = false;
    });
  }, { passive: true });

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- active nav link ---------- */
  const navLinks = [...document.querySelectorAll(".nav nav a")];
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const no = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          navLinks.forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
        }
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    sections.forEach((s) => no.observe(s));
  }

  /* ---------- stat count-up ---------- */
  const stats = document.querySelectorAll(".stat-n");
  function showFinal(el) { el.textContent = el.dataset.count + (el.dataset.suffix || ""); }
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";
    const t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / 900, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if ("IntersectionObserver" in window && !reduced) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { animateCount(e.target); so.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    stats.forEach((el) => so.observe(el));
  } else {
    stats.forEach(showFinal);
  }

  /* ---------- cycling hero terminal ----------
     Every question, answer, and query below is locked by the
     golden/adversarial test suites in the ask-your-data repo. */
  const DEMOS = [
    {
      q: 'ask "which payer type collects the least of what it bills?"',
      a: 'Self-Pay — about <strong>19%</strong> of the allowed amount, far below every insured payer type.',
      sql: "SELECT payer_type,\n       SUM(paid_amount) /\n       NULLIF(SUM(allowed_amount), 0) AS ncr\nFROM healthcare_fact_claims c\nJOIN healthcare_dim_payer p USING (payer_id)\nWHERE status = 'Paid'\nGROUP BY 1 ORDER BY ncr LIMIT 1",
    },
    {
      q: 'ask "which department has the most flight-risk employees?"',
      a: '<strong>Data &amp; Analytics</strong> has the largest number of high-risk employees on the flight-risk list.',
      sql: "SELECT department\nFROM hr_flight_risk_scores\nWHERE risk_band = 'High'\nGROUP BY department\nORDER BY COUNT(*) DESC LIMIT 1",
    },
    {
      q: 'ask "delete all denied claims"',
      a: "I can't do that — this is a <strong>read-only</strong> interface.",
      sql: null,
      refusal: "-- refused: no SQL was executed.\n-- (the read-only guard would have blocked it anyway)",
    },
  ];
  const typedEl = document.getElementById("typed");
  const output = document.getElementById("t-output");
  const answerEl = document.getElementById("t-answer");
  const sqlEl = document.getElementById("t-sql");
  const caret = document.getElementById("caret");
  const terminal = typedEl && typedEl.closest(".terminal");

  function renderDemo(d) {
    answerEl.innerHTML = d.a;
    if (d.sql) {
      sqlEl.textContent = d.sql;
      sqlEl.classList.remove("t-refusal");
    } else {
      sqlEl.textContent = d.refusal;
      sqlEl.classList.add("t-refusal");
    }
  }

  if (terminal) {
    if (reduced) {
      typedEl.textContent = DEMOS[0].q;
      renderDemo(DEMOS[0]);
      output.hidden = false;
      caret.style.display = "none";
    } else {
      let idx = 0;
      function playDemo(i) {
        const d = DEMOS[i];
        output.hidden = true;
        caret.style.display = "";
        let c = 0;
        (function type() {
          if (c <= d.q.length) {
            typedEl.textContent = d.q.slice(0, c);
            c += 1;
            setTimeout(type, 24);
          } else {
            setTimeout(() => {
              renderDemo(d);
              output.hidden = false;
              caret.style.display = "none";
              setTimeout(() => playDemo((i + 1) % DEMOS.length), 6200);
            }, 380);
          }
        })();
      }
      let started = false;
      const to = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started) { started = true; to.disconnect(); playDemo(idx); }
        });
      }, { threshold: 0.15 });
      to.observe(terminal);
    }
  }

  /* ---------- cursor spotlight on cards ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll(".card, .method-card, .xp").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- subtle 3D tilt on feature media ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll(".feature-media").forEach((wrap) => {
      const target = wrap.querySelector("img, .terminal-still");
      if (!target) return;
      wrap.addEventListener("pointermove", (e) => {
        const r = wrap.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        target.style.setProperty("--ry", (px * 5).toFixed(2) + "deg");
        target.style.setProperty("--rx", (-py * 5).toFixed(2) + "deg");
      });
      wrap.addEventListener("pointerleave", () => {
        target.style.setProperty("--rx", "0deg");
        target.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- command palette ---------- */
  const overlay = document.getElementById("palette");
  const input = document.getElementById("palette-input");
  const list = document.getElementById("palette-list");
  const COMMANDS = [
    { i: "go", label: "The work — eight repos", sub: "section", run: () => jump("#work") },
    { i: "go", label: "The method — my favorite losses", sub: "section", run: () => jump("#method") },
    { i: "go", label: "Experience", sub: "section", run: () => jump("#experience") },
    { i: "go", label: "Contact", sub: "section", run: () => jump("#contact") },
    { i: "repo", label: "Ask Your Data — grounded text-to-SQL", sub: "64 tests", run: () => open_("https://github.com/KushPatel29/IVA") },
    { i: "repo", label: "Supply Chain Control Tower", sub: "49 tests", run: () => open_("https://github.com/KushPatel29/supply-chain-control-tower-") },
    { i: "repo", label: "Customer Recommendation Engine", sub: "38 tests", run: () => open_("https://github.com/KushPatel29/Customer-Recommendation-Engine") },
    { i: "repo", label: "HR Attrition Analytics", sub: "52 tests", run: () => open_("https://github.com/KushPatel29/hr-attrition-analytics") },
    { i: "repo", label: "Supply Chain Analytics — dbt", sub: "53 tests", run: () => open_("https://github.com/KushPatel29/supply-chain-analytics-dbt") },
    { i: "repo", label: "Healthcare Claims — NRV", sub: "19 tests", run: () => open_("https://github.com/KushPatel29/healthcare-claims-analytics") },
    { i: "repo", label: "GL / P&L Reconciliation", sub: "22 tests", run: () => open_("https://github.com/KushPatel29/gl-reconciliation-dashboard-") },
    { i: "repo", label: "Legacy-to-Fabric Migration", sub: "11 tests", run: () => open_("https://github.com/KushPatel29/legacy-to-fabric-migration") },
    { i: "act", label: "Copy my email address", sub: "dharma.patel552@gmail.com", run: copyEmail },
    { i: "act", label: "Toggle dark mode", sub: "theme", run: toggleTheme },
    { i: "act", label: "Open GitHub profile", sub: "↗", run: () => open_("https://github.com/KushPatel29") },
    { i: "act", label: "Open LinkedIn", sub: "↗", run: () => open_("https://www.linkedin.com/in/kush-patel-48885719b/") },
  ];
  let filtered = COMMANDS, sel = 0;

  function jump(hash) { closePalette(); document.querySelector(hash).scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); }
  function open_(url) { closePalette(); window.open(url, "_blank", "noopener"); }
  function copyEmail() {
    navigator.clipboard && navigator.clipboard.writeText("dharma.patel552@gmail.com");
    closePalette();
  }
  function renderList() {
    list.innerHTML = "";
    if (!filtered.length) {
      const li = document.createElement("li");
      li.className = "palette-empty";
      li.textContent = "Nothing matches — try “repo”, “email”, or “dark”.";
      list.appendChild(li);
      return;
    }
    filtered.forEach((c, k) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.className = k === sel ? "sel" : "";
      li.innerHTML = '<span class="pi">' + c.i + "</span><span>" + c.label + '</span><span class="ps">' + c.sub + "</span>";
      li.addEventListener("click", c.run);
      li.addEventListener("pointerenter", () => { sel = k; renderList(); });
      list.appendChild(li);
    });
  }
  function openPalette() {
    overlay.hidden = false;
    input.value = "";
    filtered = COMMANDS; sel = 0;
    renderList();
    input.focus();
  }
  function closePalette() { overlay.hidden = true; }
  document.getElementById("palette-open").addEventListener("click", openPalette);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closePalette(); });
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    filtered = COMMANDS.filter((c) => (c.label + " " + c.sub + " " + c.i).toLowerCase().includes(q));
    sel = 0;
    renderList();
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      overlay.hidden ? openPalette() : closePalette();
      return;
    }
    if (overlay.hidden) return;
    if (e.key === "Escape") closePalette();
    else if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, filtered.length - 1); renderList(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); renderList(); }
    else if (e.key === "Enter" && filtered[sel]) { e.preventDefault(); filtered[sel].run(); }
  });

  /* ---------- footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- for the people who read consoles ---------- */
  console.log(
    "%cK.%c  You read consoles. Me too.\n" +
    "Every number on this page has a test that fails if it stops being true —\n" +
    "the SQL and the CI runs are at https://github.com/KushPatel29\n" +
    "(Also: press Ctrl/Cmd+K.)",
    "font-size:28px;font-weight:bold;color:#C96F1E;font-family:Georgia,serif",
    "font-size:12px;color:#7C8A9C"
  );
})();
