/** Consent-aware analytics dispatcher. Provider IDs are supplied at deployment. */
(function portfolioAnalytics(window, document) {
  "use strict";

  const VERSION = 2;
  const allowedEvents = new Set([
    "page_viewed",
    "project_impression",
    "project_viewed",
    "project_demo_clicked",
    "project_github_clicked",
    "case_study_viewed",
    "case_study_completed",
    "resume_viewed",
    "resume_downloaded",
    "linkedin_clicked",
    "contact_clicked",
    "navigation_used",
    "scroll_depth_reached",
    "outbound_link_clicked",
    "web_vital_recorded",
    "javascript_error_recorded",
    "consent_updated",
  ]);

  const cleanPath = () =>
    window.location.pathname.replace(/[^a-zA-Z0-9/_-]/g, "");
  const get = (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  const put = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  };
  const consentGranted = () =>
    get("analytics_consent") === "granted" &&
    window.navigator?.doNotTrack !== "1" &&
    !window.navigator?.globalPrivacyControl;
  const config = window.__ANALYTICS_CONFIG__ || {};
  const id = () => window.crypto.randomUUID();
  const visitorId = () => {
    const key = "portfolio_anonymous_id";
    const existing = get(key);
    if (existing) return existing;
    const created = id();
    put(key, created);
    return created;
  };
  const sessionId = () => {
    const key = "portfolio_session";
    const now = Date.now();
    let current;
    try {
      current = JSON.parse(get(key) || "null");
    } catch {
      current = null;
    }
    const session =
      current && now - current.last_seen_at < 30 * 60 * 1000
        ? current
        : { id: id() };
    put(key, JSON.stringify({ id: session.id, last_seen_at: now }));
    return session.id;
  };

  function baseContext() {
    return {
      event_id: id(),
      event_version: VERSION,
      occurred_at: new Date().toISOString(),
      anonymous_user_id: visitorId(),
      session_id: sessionId(),
      page_path: cleanPath(),
      consent_state: consentGranted() ? "granted" : "denied",
      is_internal: Boolean(config.isInternal),
      is_synthetic: Boolean(config.isSynthetic),
    };
  }

  function track(eventName, properties = {}) {
    if (!allowedEvents.has(eventName))
      throw new Error(`Unknown analytics event: ${eventName}`);
    if (!consentGranted()) return false;
    const safe = {};
    for (const [key, value] of Object.entries(properties)) {
      const valid =
        key === "metric_value"
          ? Number.isFinite(value) && value >= 0 && value <= 300000
          : key === "metric_name"
            ? ["LCP", "INP", "CLS", "FCP", "TTFB"].includes(value)
            : key === "rating"
              ? ["good", "needs_improvement", "poor"].includes(value)
              : [
                  "project_id",
                  "link_type",
                  "navigation_target",
                  "scroll_depth",
                  "error_type",
                  "consent_source",
                ].includes(key) &&
                typeof value === "string" &&
                /^[a-zA-Z0-9_-]{1,64}$/.test(value);
      if (!valid) throw new TypeError("Unregistered analytics property");
      safe[key] = value;
    }
    const payload = { ...baseContext(), ...safe };
    if (typeof window.gtag === "function")
      window.gtag("event", eventName, payload);
    if (window.posthog?.capture) window.posthog.capture(eventName, payload);
    window.dispatchEvent(
      new CustomEvent("portfolio:analytics", {
        detail: { eventName, payload },
      }),
    );
    return true;
  }

  window.portfolioAnalytics = Object.freeze({ track, version: VERSION });
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-analytics-event]");
    if (!target) return;
    const properties = target.dataset.analyticsProperties
      ? JSON.parse(target.dataset.analyticsProperties)
      : {};
    track(target.dataset.analyticsEvent, properties);
  });
  window.addEventListener("error", () =>
    track("javascript_error_recorded", { error_type: "runtime_error" }),
  );
  window.addEventListener("unhandledrejection", () =>
    track("javascript_error_recorded", { error_type: "unhandled_rejection" }),
  );
})(window, document);
