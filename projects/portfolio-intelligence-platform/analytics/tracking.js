/** Consent-aware analytics dispatcher. Provider IDs are supplied at deployment. */
(function portfolioAnalytics(window, document) {
  "use strict";

  const VERSION = 2;
  const allowedEvents = new Set([
    "page_viewed", "project_impression", "project_viewed", "project_demo_clicked",
    "project_github_clicked", "case_study_viewed", "case_study_completed",
    "resume_viewed", "resume_downloaded", "linkedin_clicked", "contact_clicked",
    "navigation_used", "scroll_depth_reached", "outbound_link_clicked", "web_vital_recorded",
    "javascript_error_recorded", "consent_updated"
  ]);

  const cleanPath = () => window.location.pathname.replace(/[^a-zA-Z0-9/_-]/g, "");
  const consentGranted = () => window.localStorage.getItem("analytics_consent") === "granted";
  const config = window.__ANALYTICS_CONFIG__ || {};
  const id = () => window.crypto.randomUUID();
  const visitorId = () => {
    const key = "portfolio_anonymous_id";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const created = id();
    window.localStorage.setItem(key, created);
    return created;
  };
  const sessionId = () => {
    const key = "portfolio_session";
    const now = Date.now();
    const current = JSON.parse(window.localStorage.getItem(key) || "null");
    const session = current && now - current.last_seen_at < 30 * 60 * 1000 ? current : { id: id() };
    window.localStorage.setItem(key, JSON.stringify({ id: session.id, last_seen_at: now }));
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
      is_synthetic: Boolean(config.isSynthetic)
    };
  }

  function track(eventName, properties = {}) {
    if (!allowedEvents.has(eventName)) throw new Error(`Unknown analytics event: ${eventName}`);
    if (!consentGranted()) return false;
    const payload = { ...baseContext(), ...properties };
    if (typeof window.gtag === "function") window.gtag("event", eventName, payload);
    if (window.posthog?.capture) window.posthog.capture(eventName, payload);
    window.dispatchEvent(new CustomEvent("portfolio:analytics", { detail: { eventName, payload } }));
    return true;
  }

  window.portfolioAnalytics = Object.freeze({ track, version: VERSION });
  document.addEventListener("click", event => {
    const target = event.target.closest("[data-analytics-event]");
    if (!target) return;
    const properties = target.dataset.analyticsProperties ? JSON.parse(target.dataset.analyticsProperties) : {};
    track(target.dataset.analyticsEvent, properties);
  });
  window.addEventListener("error", () => track("javascript_error_recorded", { error_type: "runtime_error" }));
  window.addEventListener("unhandledrejection", () => track("javascript_error_recorded", { error_type: "unhandled_rejection" }));
})(window, document);
