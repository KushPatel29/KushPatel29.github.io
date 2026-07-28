/* ============================================================
   Kush Patel — portfolio interactions. Zero dependencies.

   Ground rule: this file only ever *enhances*. Every number,
   card, tag and link on the page is already real HTML — if this
   script never runs, the page still reads correctly and every
   project is visible.
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Theme toggle (persisted in localStorage) ----------
     The theme itself is applied by the inline script in <head> so
     there's no flash; this only wires up the button and the label. */

  var toggle = document.getElementById("theme-toggle");
  var themeLabel = document.getElementById("theme-label");

  function paintToggle(theme) {
    if (themeLabel) themeLabel.textContent = theme === "light" ? "LIGHT" : "DARK";
    if (toggle) {
      toggle.setAttribute(
        "aria-label",
        "Switch to " + (theme === "light" ? "dark" : "light") + " theme"
      );
    }
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("kp-theme", theme); } catch (e) { /* private mode */ }
    paintToggle(theme);
  }

  paintToggle(root.getAttribute("data-theme") === "light" ? "light" : "dark");

  if (toggle) {
    toggle.addEventListener("click", function () {
      setTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light");
    });
  }

  /* ---------- 2. Scroll progress bar ---------- */

  var bar = document.getElementById("scroll-progress");
  if (bar) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var max = root.scrollHeight - root.clientHeight;
      var pct = max > 0 ? Math.min(100, (root.scrollTop / max) * 100) : 0;
      bar.style.width = pct + "%";
    };
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------- 3. Work filter + live repo count ---------- */

  var chips = Array.prototype.slice.call(document.querySelectorAll("#filter-chips .chip"));
  var projects = Array.prototype.slice.call(document.querySelectorAll(".project"));
  var countEl = document.getElementById("work-count");
  var emptyEl = document.getElementById("work-empty");
  var total = projects.length;

  function applyFilter(tag) {
    var shown = 0;

    projects.forEach(function (card) {
      var tags = (card.getAttribute("data-tags") || "").split(/\s+/);
      var match = tag === "all" || tags.indexOf(tag) > -1;
      card.classList.toggle("is-filtered-out", !match);
      if (match) shown++;
    });

    chips.forEach(function (chip) {
      var active = chip.getAttribute("data-filter") === tag;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", active ? "true" : "false");
    });

    if (countEl) countEl.textContent = "SHOWING " + shown + " / " + total + " REPOS";
    if (emptyEl) emptyEl.hidden = shown > 0;
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      applyFilter(chip.getAttribute("data-filter") || "all");
    });
  });

  if (countEl && total) countEl.textContent = "SHOWING " + total + " / " + total + " REPOS";

  /* The "start here" router jumps to a specific card — clear any
     active filter first so the card it points at is actually there. */
  Array.prototype.slice
    .call(document.querySelectorAll('.router-to a[href^="#p-"]'))
    .forEach(function (link) {
      link.addEventListener("click", function () { applyFilter("all"); });
    });

  /* ---------- 4. Sideways-scroll hint on the nav and chip strips ---------- */

  var strips = [
    document.querySelector(".nav-links"),
    document.getElementById("filter-chips")
  ].filter(Boolean);

  function syncStrips() {
    strips.forEach(function (el) {
      el.classList.toggle("can-scroll-x", el.scrollWidth > el.clientWidth + 1);
    });
  }

  syncStrips();
  window.addEventListener("resize", syncStrips);
  // Web fonts change the measurements, so re-check once they land.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncStrips);

  /* ---------- 5. Metric count-up ----------
     The final values are already in the HTML. We only ever animate
     up to them, and the animation always lands on the real number. */

  var metrics = Array.prototype.slice.call(document.querySelectorAll(".metric-value[data-count]"));

  if (metrics.length && !reduced && typeof IntersectionObserver === "function") {
    var run = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var suffix = el.getAttribute("data-suffix") || "";
      if (!isFinite(target)) return;

      var started = null;
      var DURATION = 1400;

      var step = function (now) {
        if (started === null) started = now;
        var p = Math.min(1, (now - started) / DURATION);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent = target + suffix; // always land on the truth
        }
      };

      el.textContent = "0" + suffix;
      window.requestAnimationFrame(step);
    };

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        run(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px" });

    metrics.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 6. Tenure, computed so it never goes stale ---------- */

  Array.prototype.slice.call(document.querySelectorAll(".xp-dur[data-since]")).forEach(function (el) {
    var parts = (el.getAttribute("data-since") || "").split("-");
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    if (!isFinite(year) || !isFinite(month)) return;

    var now = new Date();
    // Inclusive of both the start month and the current one.
    var months = (now.getFullYear() - year) * 12 + (now.getMonth() - (month - 1)) + 1;
    if (months < 1) return;

    var years = Math.floor(months / 12);
    var rem = months % 12;
    var out = [];
    if (years) out.push(years + " yr" + (years > 1 ? "s" : ""));
    if (rem) out.push(rem + " mo" + (rem > 1 ? "s" : ""));

    el.textContent = " · " + out.join(" ");
  });

  /* ---------- 7. Footer year ---------- */

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
