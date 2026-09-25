(function observeWebVitals(window) {
  "use strict";
  const report = (metricName, metricValue, rating) => window.portfolioAnalytics?.track("web_vital_recorded", {
    metric_name: metricName,
    metric_value: Math.round(metricValue * 1000) / 1000,
    rating
  });
  const ratingFor = (name, value) => {
    const thresholds = { LCP:[2500,4000], CLS:[0.1,0.25], INP:[200,500], FCP:[1800,3000], TTFB:[800,1800] }[name];
    return value <= thresholds[0] ? "good" : value <= thresholds[1] ? "needs_improvement" : "poor";
  };
  try {
    new PerformanceObserver(list => list.getEntries().forEach(entry => report("LCP", entry.startTime, ratingFor("LCP", entry.startTime)))).observe({ type:"largest-contentful-paint", buffered:true });
    let cls = 0;
    new PerformanceObserver(list => { list.getEntries().forEach(entry => { if (!entry.hadRecentInput) cls += entry.value; }); report("CLS", cls, ratingFor("CLS", cls)); }).observe({ type:"layout-shift", buffered:true });
    new PerformanceObserver(list => list.getEntries().forEach(entry => report("INP", entry.duration, ratingFor("INP", entry.duration)))).observe({ type:"event", buffered:true, durationThreshold:40 });
    new PerformanceObserver(list => list.getEntries().filter(entry => entry.name === "first-contentful-paint").forEach(entry => report("FCP", entry.startTime, ratingFor("FCP", entry.startTime)))).observe({ type:"paint", buffered:true });
    const navigation = window.performance.getEntriesByType("navigation")[0];
    if (navigation) report("TTFB", navigation.responseStart, ratingFor("TTFB", navigation.responseStart));
  } catch (_) { /* Unsupported observers do not affect page behavior. */ }
})(window);
