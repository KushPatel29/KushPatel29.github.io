module.exports = {
  ci: {
    collect: {
      staticDistDir: ".",
      url: ["/"],
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--headless --no-sandbox --disable-dev-shm-usage",
        formFactor: "desktop",
        screenEmulation: { mobile: false, width: 1440, height: 1000, deviceScaleFactor: 1 },
      },
    },
    assert: {
      assertions: {
        // Keep 95 as the visible optimization target, while release blocking
        // is based on the less volatile user-experience metrics below.
        "categories:performance": ["warn", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 0.95 }],
        "first-contentful-paint": ["error", { maxNumericValue: 1800 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "speed-index": ["error", { maxNumericValue: 3000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./artifacts/lighthouse",
    },
  },
};
