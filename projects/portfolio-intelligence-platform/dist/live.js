import { readAnalytics } from "./live-model.js?v=40e4b83dd091";
const $ = (s) => document.querySelector(s),
  KEY = "portfolio_owner_read_key";
let token = "",
  timer,
  lastData = null,
  controller,
  generation = 0,
  stale = false,
  fetching = false;
const duration = (s) =>
  s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
function status(text, error = false) {
  $("#live-status").textContent = text;
  $("#live-status").dataset.error = String(error);
}
function rows(selector, values, key, format, empty) {
  const list = $(selector);
  list.replaceChildren();
  if (!values.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = empty;
    list.append(li);
    return;
  }
  const max = Math.max(1, ...values.map((x) => x[key]));
  for (const item of values) {
    const li = document.createElement("li"),
      label = document.createElement("span"),
      value = document.createElement("strong"),
      meter = document.createElement("meter");
    label.textContent = item.label;
    value.textContent = format(item[key]);
    meter.min = 0;
    meter.max = max;
    meter.value = item[key];
    meter.setAttribute("aria-label", `${item.label}: ${format(item[key])}`);
    li.append(label, value, meter);
    list.append(li);
  }
}
function render(data) {
  document.body.classList.remove("locked");
  $("#visits").textContent = data.visits.toLocaleString();
  $("#attention-total").textContent = duration(data.engagedSeconds);
  $("#most-read").textContent = data.attention[0]?.label || "No data yet";
  $("#resume-actions").textContent = data.actions.resume.toLocaleString();
  $("#live-window").textContent =
    `${data.start.slice(0, 10)} – ${data.end.slice(0, 10)} · UTC · today is partial`;
  $("#updated").textContent =
    `Retrieved ${new Date(data.updatedAt).toLocaleTimeString()} · refreshes every 60 seconds`;
  rows(
    "#attention-rows",
    data.attention,
    "seconds",
    duration,
    "No section-time events yet. New visits start contributing after 15 active seconds in a section.",
  );
  rows(
    "#country-rows",
    data.countries.map((x) => ({ label: x.name || "Unknown", count: x.count })),
    "count",
    (n) => n.toLocaleString(),
    "No location data in this period.",
  );
  $("#location-note").textContent =
    `Approximate countries for homepage visits. ${data.coverage.countryVisits} visits in displayed country buckets. Geographic day buckets can differ from hourly visit boundaries; percentages are not inferred. VPNs and proxies can change the result.${data.countriesMore ? " Top 100 only; remaining countries are not displayed." : ""}`;
  rows(
    "#page-rows",
    data.pages,
    "count",
    (n) => n.toLocaleString(),
    "No recorded pages in this period.",
  );
  rows(
    "#project-rows-live",
    data.projects,
    "count",
    (n) => n.toLocaleString(),
    "No project-link events yet. Collection begins with the tracking release.",
  );
  const chart = $("#visit-chart");
  chart.replaceChildren();
  const max = Math.max(1, ...data.daily.map((x) => x.daily));
  const body = $("#live-daily-table");
  body.replaceChildren();
  for (const day of data.daily) {
    const wrap = document.createElement("div"),
      bar = document.createElement("i");
    wrap.className = "day";
    wrap.title = `${day.day}: ${day.daily} visits`;
    bar.style.height = `${(100 * day.daily) / max}%`;
    wrap.append(bar);
    chart.append(wrap);
    const row = document.createElement("tr");
    for (const value of [day.day, day.daily]) {
      const td = document.createElement("td");
      td.textContent = value;
      row.append(td);
    }
    body.append(row);
  }
  chart.setAttribute(
    "aria-label",
    `${data.daily.length} account-calendar days; ${data.visits} estimated visits. Daily counts are available in the table below.`,
  );
  $("#daily-start").textContent = data.daily[0]?.day || "—";
  $("#daily-end").textContent = data.daily.at(-1)?.day || "—";
  $("#coverage-status").textContent = data.engagedSeconds
    ? `${duration(data.engagedSeconds)} sampled attention across ${data.attention.length} registered areas. Counts cannot identify individual people or link their journeys.`
    : "Visits are available; attention has no recorded events in this period. Historical attention cannot be backfilled. DNT/GPC, opt-out, short visits and blocked scripts also reduce coverage.";
  $("#quality-status").textContent =
    `${data.requests} read-only API requests · path pagination complete · daily totals reconciled · QA events excluded. Retrieval time is not the provider’s processing timestamp.`;
  const c = data.comparison;
  $("#comparison").hidden = !$("#compare").checked;
  $("#comparison-result").textContent =
    Number($("#range").value) === 1
      ? "Choose 7, 30 or 90 days to compare complete days."
      : c?.error
        ? `Comparison unavailable: ${c.error}`
        : c
          ? `${c.current} visits versus ${c.previous} in the preceding equal window. ${c.changePercent === null ? "Percentage change unavailable because the baseline is zero." : `${c.changePercent >= 0 ? "+" : ""}${c.changePercent.toFixed(1)}% change.`}`
          : "Comparison not requested.";
  $("#comparison-window").textContent =
    c && !c.error
      ? `Current: ${c.currentStart.slice(0, 10)} to ${c.end.slice(0, 10)}. Previous begins ${c.previousStart.slice(0, 10)}. Both windows end before the next window starts and exclude today.`
      : "";
  $("#export").disabled = false;
  $("#export-csv").disabled = false;
}
function clearData() {
  lastData = null;
  stale = false;
  document.body.classList.add("locked");
  for (const id of ["visits", "attention-total", "most-read", "resume-actions"])
    $("#" + id).textContent = "—";
  for (const id of [
    "attention-rows",
    "country-rows",
    "page-rows",
    "project-rows-live",
    "visit-chart",
    "live-daily-table",
  ])
    $("#" + id).replaceChildren();
  $("#comparison").hidden = true;
  $("#export").disabled = true;
  $("#export-csv").disabled = true;
  $("#coverage-status").textContent =
    "Connect to inspect measurement coverage.";
  $("#quality-status").textContent =
    "No API response accepted for this window.";
  $("#updated").textContent = "Not connected";
}
async function refresh({ reset = false } = {}) {
  if (!token || document.visibilityState === "hidden" || (fetching && !reset))
    return false;
  fetching = true;
  controller?.abort();
  controller = new AbortController();
  const mine = ++generation;
  if (reset) clearData();
  $("#refresh").disabled = true;
  $("#export").disabled = true;
  $("#export-csv").disabled = true;
  status("Refreshing private GoatCounter statistics…");
  try {
    const data = await readAnalytics(
      token,
      Number($("#range").value),
      fetch,
      new Date(),
      { signal: controller.signal, compare: $("#compare").checked },
    );
    if (mine !== generation) return false;
    lastData = data;
    stale = false;
    render(data);
    $("#connection-form").hidden = true;
    $("#disconnect").hidden = false;
    status("Connected · real traffic · only visible in this connected browser");
    return true;
  } catch (error) {
    if (mine !== generation) return false;
    stale = Boolean(lastData);
    status(
      error.message +
        " " +
        (lastData
          ? "Last successful values remain visible; they are not current."
          : "No live values are being shown."),
      true,
    );
    if (!lastData) $("#connection-form").hidden = false;
    $("#updated").textContent = lastData
      ? `Last successful retrieval ${new Date(lastData.updatedAt).toLocaleString()}`
      : "Not connected";
    $("#export").disabled = !lastData;
    $("#export-csv").disabled = !lastData;
    return false;
  } finally {
    if (mine === generation) {
      fetching = false;
      $("#refresh").disabled = false;
    }
  }
}
function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => refresh(), 60000);
}
$("#connection-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const candidate = $("#api-key").value.trim();
  if (!candidate) return;
  token = candidate;
  $("#api-key").value = "";
  try {
    localStorage.removeItem(KEY);
  } catch {}
  const connected = await refresh({ reset: true });
  if (token !== candidate) return;
  if (connected && $("#remember").checked) {
    try {
      localStorage.setItem(KEY, token);
    } catch {
      status(
        "Connected without browser storage; this connection lasts until reload.",
      );
    }
  }
  if (connected) startTimer();
});
$("#refresh").addEventListener("click", () => refresh());
$("#range").addEventListener("change", () => refresh({ reset: true }));
$("#compare").addEventListener("change", () => refresh({ reset: true }));
$("#disconnect").addEventListener("click", () => {
  token = "";
  generation++;
  fetching = false;
  controller?.abort();
  clearInterval(timer);
  try {
    localStorage.removeItem(KEY);
  } catch {}
  clearData();
  $("#connection-form").hidden = false;
  $("#disconnect").hidden = true;
  status("Disconnected. Saved key and displayed data removed.");
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refresh();
});
function download(content, type, name) {
  const url = URL.createObjectURL(new Blob([content], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("#export").addEventListener("click", () => {
  if (lastData)
    download(
      JSON.stringify(
        {
          source: "GoatCounter owner aggregates",
          state: stale ? "stale" : "retrieved",
          ...lastData,
        },
        null,
        2,
      ),
      "application/json",
      `portfolio-analytics-${lastData.end.slice(0, 10)}.json`,
    );
});
$("#export-csv").addEventListener("click", () => {
  if (!lastData) return;
  const lines = [
    [
      "day_account_timezone",
      "estimated_homepage_visits",
      "retrieved_at",
      "state",
    ],
    ...lastData.daily.map((d) => [
      d.day,
      d.daily,
      lastData.updatedAt,
      stale ? "stale" : "retrieved",
    ]),
  ];
  download(
    lines
      .map((row) =>
        row.map((x) => '"' + String(x).replaceAll('"', '""') + '"').join(","),
      )
      .join("\r\n"),
    "text/csv",
    "portfolio-daily-visits.csv",
  );
});
try {
  token = localStorage.getItem(KEY) || "";
} catch {}
if (token) {
  $("#connection-form").hidden = true;
  refresh();
  startTimer();
}
