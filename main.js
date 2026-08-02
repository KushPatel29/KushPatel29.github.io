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

  function each(sel, fn, scope) {
    Array.prototype.slice.call((scope || document).querySelectorAll(sel)).forEach(fn);
  }

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

  /* ---------- 2. Scroll progress + back to top ---------- */

  var bar = document.getElementById("scroll-progress");
  var toTop = document.getElementById("to-top");

  if (bar || toTop) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var max = root.scrollHeight - root.clientHeight;
      var pct = max > 0 ? Math.min(100, (root.scrollTop / max) * 100) : 0;
      if (bar) bar.style.width = pct + "%";
      if (toTop) toTop.hidden = root.scrollTop < 700;
    };
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------- 3. Work filter, with the state kept in the URL ----------
     So "?filter=finance#work" can be pasted straight into an
     application and land on exactly the subset it names. */

  var chips = Array.prototype.slice.call(document.querySelectorAll("#filter-chips .chip"));
  var projects = Array.prototype.slice.call(document.querySelectorAll(".project"));
  var countEl = document.getElementById("work-count");
  var emptyEl = document.getElementById("work-empty");
  var total = projects.length;
  var FILTER_KEY = "filter";

  function knownFilter(tag) {
    for (var i = 0; i < chips.length; i++) {
      if (chips[i].getAttribute("data-filter") === tag) return true;
    }
    return false;
  }

  function applyFilter(tag, writeUrl) {
    if (!knownFilter(tag)) tag = "all";
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

    if (writeUrl) writeFilterToUrl(tag);
  }

  function writeFilterToUrl(tag) {
    if (!window.history || !window.history.replaceState) return;
    try {
      var url = new URL(window.location.href);
      if (tag === "all") url.searchParams.delete(FILTER_KEY);
      else url.searchParams.set(FILTER_KEY, tag);
      // Anchor the shared link at the work section so it lands where it means to.
      url.hash = tag === "all" ? url.hash : "#work";
      window.history.replaceState(null, "", url.toString());
    } catch (e) { /* older browser — the filter still works, it just isn't shareable */ }
  }

  function readFilterFromUrl() {
    try {
      return new URL(window.location.href).searchParams.get(FILTER_KEY) || "all";
    } catch (e) {
      return "all";
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      applyFilter(chip.getAttribute("data-filter") || "all", true);
    });
  });

  if (chips.length) {
    // Restore whatever the URL asked for, without writing it back.
    var fromUrl = readFilterFromUrl();
    applyFilter(fromUrl, false);

    /* The browser resolves the #hash while every card is still visible,
       then we hide some and the target moves out from under it. Re-aim
       once, but only when we actually changed the layout. */
    if (fromUrl !== "all" && window.location.hash.length > 1) {
      var landing = document.getElementById(window.location.hash.slice(1));
      if (landing) {
        window.requestAnimationFrame(function () {
          landing.scrollIntoView({ block: "start" });
        });
      }
    }
  } else if (countEl && total) {
    countEl.textContent = "SHOWING " + total + " / " + total + " REPOS";
  }

  /* Anything that jumps straight to a project card — the "start here"
     router, the domain tiles — clears the filter first, so the card it
     points at is actually on screen when you arrive. */
  each('a[href^="#p-"]', function (link) {
    link.addEventListener("click", function () { applyFilter("all", true); });
  });

  /* ---------- 4. Sideways-scroll hint on the chip strip ---------- */

  var strips = [document.getElementById("filter-chips")].filter(Boolean);

  function syncStrips() {
    strips.forEach(function (el) {
      el.classList.toggle("can-scroll-x", el.scrollWidth > el.clientWidth + 1);
    });
  }

  syncStrips();
  window.addEventListener("resize", syncStrips);
  // Web fonts change the measurements, so re-check once they land.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncStrips);

  /* ---------- 5. Compact nav menu ----------
     The disclosure itself is native <details>; this only closes it
     after you've picked something, or clicked away. */

  var navMenu = document.getElementById("nav-menu");
  if (navMenu) {
    each("a", function (link) {
      link.addEventListener("click", function () { navMenu.open = false; });
    }, navMenu);

    document.addEventListener("click", function (e) {
      if (navMenu.open && !navMenu.contains(e.target)) navMenu.open = false;
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navMenu.open) {
        navMenu.open = false;
        var btn = navMenu.querySelector("summary");
        if (btn) btn.focus();
      }
    });
  }

  /* ---------- 6. Metric count-up ----------
     The final values are already in the HTML. Two rules: we never
     blank a number until we know the animation is actually running,
     and a watchdog puts the true value back if it isn't. A counter
     stuck on 0 is worse than a counter that never animated. */

  var metrics = Array.prototype.slice.call(document.querySelectorAll(".metric-value[data-count]"));

  if (metrics.length && !reduced && typeof IntersectionObserver === "function") {
    var run = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var suffix = el.getAttribute("data-suffix") || "";
      if (!isFinite(target)) return;

      var truth = target + suffix;
      var started = null;
      var done = false;
      var DURATION = 1400;

      var land = function () {
        if (done) return;
        done = true;
        el.textContent = truth; // always land on the truth
      };

      var step = function (now) {
        if (done) return;
        if (started === null) {
          started = now;
          el.textContent = "0" + suffix; // only now, once we know frames are running
        }
        var p = Math.min(1, (now - started) / DURATION);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
        else land();
      };

      window.requestAnimationFrame(step);
      // Backgrounded tab, throttled rAF, anything else: never leave it at 0.
      window.setTimeout(land, DURATION + 600);
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

  /* ---------- 7. Scrollspy ----------
     Marks the section you're actually reading with aria-current, in
     both the desktop nav and the compact menu. */

  var spyLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-links a[href^="#"], .nav-menu-panel a[href^="#"]')
  );

  if (spyLinks.length && typeof IntersectionObserver === "function") {
    var sections = [];
    var seen = {};

    spyLinks.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      if (!id || seen[id]) return;
      var el = document.getElementById(id);
      if (!el) return;
      seen[id] = true;
      sections.push(el);
    });

    var visible = [];
    var current = null;

    var paint = function (id) {
      if (id === current) return;
      current = id;
      spyLinks.forEach(function (link) {
        var match = link.getAttribute("href") === "#" + id;
        if (match) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        var at = visible.indexOf(id);
        if (entry.isIntersecting && at === -1) visible.push(id);
        else if (!entry.isIntersecting && at > -1) visible.splice(at, 1);
      });

      if (!visible.length) return;

      // Whichever of the in-band sections comes first in the document wins.
      var order = sections.map(function (s) { return s.id; });
      var best = visible.slice().sort(function (a, b) {
        return order.indexOf(a) - order.indexOf(b);
      })[0];

      paint(best);
    }, { rootMargin: "-88px 0px -55% 0px", threshold: 0 });

    sections.forEach(function (el) { spy.observe(el); });
  }

  /* ---------- 8. Dashboard lightbox ----------
     The card thumbnails are a 1280px-wide capture cropped to a strip.
     This is where the actual dashboard is legible. */

  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxCaption = document.getElementById("lightbox-caption");
  var lightboxClose = document.getElementById("lightbox-close");
  var lastZoomTrigger = null;

  var canDialog = lightbox && typeof lightbox.showModal === "function";

  each(".card-zoom", function (btn) {
    btn.addEventListener("click", function (e) {
      var src = btn.getAttribute("data-zoom");
      var img = btn.querySelector("img");
      var alt = img ? img.getAttribute("alt") || "" : "";
      if (!src) return;

      // No <dialog> support: the image itself is still one click away.
      if (!canDialog) {
        window.open(src, "_blank", "noopener");
        return;
      }

      e.preventDefault();
      lastZoomTrigger = btn;
      lightboxImg.setAttribute("src", src);
      lightboxImg.setAttribute("alt", alt);
      if (lightboxCaption) lightboxCaption.textContent = alt;
      lightbox.showModal();
    });
  });

  if (canDialog) {
    if (lightboxClose) {
      lightboxClose.addEventListener("click", function () { lightbox.close(); });
    }

    // Clicking the backdrop (i.e. the dialog itself, not its contents) closes.
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) lightbox.close();
    });

    lightbox.addEventListener("close", function () {
      lightboxImg.setAttribute("src", "");
      lightboxImg.setAttribute("alt", "");
      if (lastZoomTrigger) {
        lastZoomTrigger.focus();
        lastZoomTrigger = null;
      }
    });
  }

  /* ---------- 9. Footer year ---------- */

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- 10. Hero terminal ----------
     The panel is styled like a live CLI, so leaving it on one frozen frame
     reads as a broken widget. Type each question, then reveal its answer
     and the SQL that produced it.

     Every question, answer and query below is lifted verbatim from
     evals/golden_questions.yaml in the ask-your-data repo, and each value
     was re-run against the warehouse rather than copied from the YAML —
     otherwise the caption's "pinned by golden-question tests in CI" claim
     would be decoration. The refusal underneath stays put: it is the
     point of the panel, not one frame of it. */

  var typed = document.getElementById("t-typed");
  var termOut = document.getElementById("t-out");
  var termA = document.getElementById("t-a");
  var termSql = document.getElementById("t-sql");
  var typeCaret = document.getElementById("t-caret");
  var restCaret = document.getElementById("t-caret-rest");
  var termPanel = typed && typed.closest ? typed.closest(".terminal") : null;

  if (termPanel && termOut && termA && termSql && !reduced) {
    var DEMOS = [
      {
        q: "how many migration artifacts passed parallel-run validation?",
        a: "107 artifacts have a GO verdict.",
        sql: "SELECT COUNT(*) FROM migration_parallel_run_results\nWHERE verdict = 'GO'"
      },
      {
        q: "which payer type collects the least of what it bills?",
        a: "Self-Pay — the lowest net collection rate of any payer type.",
        sql: "SELECT p.payer_type,\n       SUM(paid_amount) / SUM(allowed_amount) AS ncr\nFROM healthcare_fact_claims c\nJOIN healthcare_dim_payer p ON c.payer_id = p.payer_id\nWHERE status = 'Paid'\nGROUP BY 1 ORDER BY ncr LIMIT 1"
      },
      {
        q: "which department has the most flight-risk employees?",
        a: "Data & Analytics has the most high-risk employees.",
        sql: "SELECT department FROM hr_flight_risk_scores\nWHERE risk_band = 'High'\nGROUP BY department\nORDER BY COUNT(*) DESC LIMIT 1"
      }
    ];

    var TYPE_MS = 26;
    var REVEAL_MS = 380;
    var DWELL_MS = 6200;
    var termTimer = null;

    var showCaret = function (typing) {
      if (typeCaret) typeCaret.hidden = !typing;
      if (restCaret) restCaret.hidden = typing;
    };

    /* The three answers are different heights (the SQL runs 2, 4 and 6
       lines), and blanking the block during typing collapses it entirely.
       Left alone the panel bounced 191px every cycle, in the hero, which
       reads as breakage rather than animation. Reserve the tallest state
       up front and hold it. Measured rather than hard-coded so it stays
       right at every breakpoint — the mono font shrinks under 900px. */
    var qLine = typed.parentElement;

    var reserve = function () {
      var restoreA = termA.textContent;
      var restoreSql = termSql.textContent;
      var restoreQ = typed.textContent;
      termOut.style.minHeight = "0px";
      qLine.style.minHeight = "0px";
      var tallest = 0;
      var tallestQ = 0;
      DEMOS.forEach(function (d) {
        termA.textContent = d.a;
        termSql.textContent = d.sql;
        typed.textContent = d.q;
        tallest = Math.max(tallest, termOut.offsetHeight);
        /* The longer questions wrap to a second line partway through
           typing, which moved everything below them by 23px. Reserve the
           tallest question too, or the panel still walks about. */
        tallestQ = Math.max(tallestQ, qLine.offsetHeight);
      });
      termA.textContent = restoreA;
      termSql.textContent = restoreSql;
      typed.textContent = restoreQ;
      if (tallest) termOut.style.minHeight = tallest + "px";
      if (tallestQ) qLine.style.minHeight = tallestQ + "px";
    };

    var play = function (i) {
      var d = DEMOS[i];
      /* visibility, not the hidden attribute: display:none would drop the
         reserved box and reintroduce the jump. */
      termOut.style.visibility = "hidden";
      showCaret(true);
      var c = 0;
      var type = function () {
        if (c <= d.q.length) {
          typed.textContent = d.q.slice(0, c);
          c += 1;
          termTimer = setTimeout(type, TYPE_MS);
          return;
        }
        termTimer = setTimeout(function () {
          termA.textContent = d.a;
          termSql.textContent = d.sql;
          termOut.style.visibility = "visible";
          showCaret(false);
          termTimer = setTimeout(function () {
            play((i + 1) % DEMOS.length);
          }, DWELL_MS);
        }, REVEAL_MS);
      };
      type();
    };

    /* A backgrounded tab throttles timers into a queue that all fires at
       once on return, which fast-forwards the cycle. Stop while hidden. */
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && termTimer) {
        clearTimeout(termTimer);
        termTimer = null;
      } else if (!document.hidden && !termTimer) {
        play(0);
      }
    });

    /* Deliberately not gated on IntersectionObserver. The panel sits in the
       hero, above the fold on every viewport, so "start when scrolled into
       view" buys nothing — and an observer that fails to fire (which is
       exactly what happened here) leaves the terminal frozen on one frame,
       looking like a broken widget. Start it, and let the visibility
       handler deal with backgrounded tabs. */
    termPanel.dataset.started = "1";
    reserve();
    play(0);

    /* JetBrains Mono is wider than the fallback, so a first measurement
       taken before it lands under-reserves and the panel still twitches.
       Same reason syncStrips re-runs on fonts.ready. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserve);

    /* Re-measure whenever the panel's width actually changes. A window
       resize listener alone is not enough — the panel also reflows when a
       scrollbar appears or the font swaps in, and those fire no resize
       event. Width-gated so reserve()'s own height change can't loop. */
    var reserveTimer = null;
    var requeue = function () {
      clearTimeout(reserveTimer);
      reserveTimer = setTimeout(reserve, 150);
    };

    if (typeof ResizeObserver === "function") {
      /* Starts at 0, not the current width, so the observer's initial
         callback always re-measures at settled layout. Seeding it with
         the live width meant a first measurement taken mid-layout — when
         the panel was a couple of characters wide and the question
         wrapped over 50 lines — was never corrected, and the reservation
         stuck at 1176px. */
      var lastWidth = 0;
      new ResizeObserver(function () {
        var w = termPanel.clientWidth;
        if (w && w !== lastWidth) {
          lastWidth = w;
          requeue();
        }
      }).observe(termPanel);
    }
    window.addEventListener("resize", requeue);
    window.addEventListener("load", requeue);
  }
})();
