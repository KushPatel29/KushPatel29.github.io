import { test } from "node:test";
import assert from "node:assert/strict";
import {
  modelHits,
  readAnalytics,
  visitTotal,
  normalizeDaily,
} from "../dist/live-model.js";
import { statsClient } from "../dist/api-client.js";
test("heartbeats convert to seconds while QA and unknown areas never inflate attention", () => {
  const data = modelHits([
    { path: "/", count: 8 },
    { path: "pi-time-15s:intro", count: 3, event: true },
    { path: "pi-time-15s:p-growthops", count: 5, event: true },
    { path: "qa:pi-time-15s:intro", count: 100, event: true },
    { path: "pi-time-15s:unregistered", count: 100, event: true },
    { path: "pi-action:resume", count: 2, event: true },
  ]);
  assert.equal(data.engagedSeconds, 120);
  assert.equal(data.attention[0].id, "p-growthops");
  assert.equal(data.pages[0].count, 8);
  assert.equal(data.actions.resume, 2);
});
test("malformed counts fail closed", () =>
  assert.throws(() => modelHits([{ path: "/", count: -1 }]), /Invalid count/));
test("API paginates all paths, filters root geography and never places the key in a URL", async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push(url);
    assert.equal(options.headers.Authorization, "Bearer fixture-secret");
    assert(!url.includes("fixture-secret"));
    const u = new URL(url);
    let body;
    if (u.pathname.endsWith("/hits"))
      body = u.searchParams.has("exclude_paths")
        ? {
            hits: [
              { path: "pi-time-15s:intro", path_id: 2, count: 2, event: true },
            ],
            more: false,
          }
        : { hits: [{ path: "/", path_id: 1, count: 4 }], more: true };
    else if (u.pathname.endsWith("/total")) {
      assert.equal(u.searchParams.get("include_paths"), "/");
      body = {
        total: 4,
        total_events: 0,
        stats: [{ day: "2026-10-24", daily: 4 }],
      };
    } else {
      assert.equal(u.searchParams.get("include_paths"), "/");
      body = { stats: [{ name: "Canada", count: 4 }], more: false };
    }
    return { ok: true, status: 200, json: async () => body };
  };
  const data = await readAnalytics(
    "fixture-secret",
    7,
    fetcher,
    new Date("2026-10-24T12:30:00Z"),
  );
  assert.equal(data.visits, 4);
  assert.equal(data.engagedSeconds, 30);
  assert.equal(calls.length, 4);
  assert.equal(data.start, "2026-10-18T00:00:00.000Z");
});

test("invalid totals never produce negative or non-integer visits", () => {
  for (const value of [
    { total: 4, total_events: 5 },
    { total: 4, total_events: -1 },
    { total: -2 },
    { total: 1.5 },
    { total: Number.MAX_SAFE_INTEGER + 1 },
  ])
    assert.throws(() => visitTotal(value), /Invalid/);
});
test("dense days preserve true zeros and reject unreconciled or duplicate daily records", () => {
  const start = new Date("2026-10-18T00:00Z"),
    end = new Date("2026-10-24T12:00Z");
  const rows = normalizeDaily([{ day: "2026-10-24", daily: 4 }], start, end, 4);
  assert.equal(rows.length, 7);
  assert.equal(rows[0].daily, 0);
  assert.throws(() => normalizeDaily([], start, end, 4), /reconcile/);
  assert.throws(
    () =>
      normalizeDaily(
        [
          { day: "2026-10-24", daily: 2 },
          { day: "2026-10-24", daily: 2 },
        ],
        start,
        end,
        4,
      ),
    /duplicate/,
  );
});
test("rate limits and temporary server failures retry at most twice; key stays out of URLs", async () => {
  let calls = 0;
  const sleeps = [];
  const client = statsClient(
    "test-key",
    async (url) => {
      assert(!url.includes("test-key"));
      calls++;
      return calls < 3
        ? { status: calls === 1 ? 429 : 503, ok: false }
        : { ok: true, status: 200, json: async () => ({ total: 1 }) };
    },
    { sleep: async (ms) => sleeps.push(ms) },
  );
  assert.equal((await client.get("total", {})).total, 1);
  assert.equal(calls, 3);
  assert(sleeps.every((x) => x <= 5000));
  calls = 0;
  const failed = statsClient(
    "test-key",
    async () => {
      calls++;
      return { ok: false, status: 503 };
    },
    { sleep: async () => {} },
  );
  await assert.rejects(failed.get("total", {}), /503/);
  assert.equal(calls, 3);
});
test("repeated pagination IDs fail instead of silently double counting", async () => {
  await assert.rejects(
    readAnalytics(
      "key",
      7,
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          hits: [{ path_id: 1, path: "/", count: 2 }],
          more: true,
        }),
      }),
      new Date("2026-10-24T12:00Z"),
      { sleep: async () => {} },
    ),
    /Repeated/,
  );
});
test("comparison uses equal complete UTC days and a zero baseline has no percentage", async () => {
  const ranges = [];
  let totals = 0;
  const fetcher = async (url) => {
    const u = new URL(url);
    let body;
    if (u.pathname.endsWith("/hits")) body = { hits: [], more: false };
    else if (u.pathname.endsWith("/locations"))
      body = { stats: [], more: false };
    else {
      ranges.push([u.searchParams.get("start"), u.searchParams.get("end")]);
      totals++;
      body =
        totals === 1
          ? { total: 0, stats: [] }
          : { total: totals === 2 ? 4 : 0 };
    }
    return { ok: true, status: 200, json: async () => body };
  };
  const result = await readAnalytics(
    "key",
    7,
    fetcher,
    new Date("2026-10-24T12:00Z"),
    { compare: true, sleep: async () => {} },
  );
  assert.equal(result.comparison.current, 4);
  assert.equal(result.comparison.changePercent, null);
  assert.deepEqual(ranges[1], [
    "2026-10-17T00:00:00.000Z",
    "2026-10-23T23:59:59.999Z",
  ]);
  assert.deepEqual(ranges[2], [
    "2026-10-10T00:00:00.000Z",
    "2026-10-16T23:59:59.999Z",
  ]);
});
test("aborted reads do not continue making requests", async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  await assert.rejects(
    readAnalytics(
      "key",
      7,
      async () => {
        calls++;
      },
      new Date("2026-10-24"),
      { signal: controller.signal },
    ),
  );
  assert.equal(calls, 0);
});
test("authentication failure is explicit", async () => {
  await assert.rejects(
    readAnalytics("invalid", 1, async () => ({ ok: false, status: 403 })),
    /Access denied/,
  );
});

test("a legitimate empty window accepts explicit null lists without inventing traffic", async () => {
  const fetcher = async (url) => ({
    ok: true,
    status: 200,
    json: async () =>
      url.includes("/hits?")
        ? { hits: null, more: false }
        : url.includes("/locations?")
          ? { stats: null, more: false }
          : { total: 0, total_events: 0, stats: null },
  });
  const data = await readAnalytics(
    "key",
    1,
    fetcher,
    new Date("2026-10-24T23:40Z"),
    { sleep: async () => {} },
  );
  assert.equal(data.visits, 0);
  assert.equal(data.daily.length, 1);
  assert.equal(data.daily[0].daily, 0);
  assert.deepEqual(data.countries, []);
});
test("account timezone edge buckets are retained and reconcile without relabelling them UTC", () => {
  const data = normalizeDaily(
    [
      { day: "2026-10-17", daily: 1 },
      { day: "2026-10-24", daily: 2 },
      { day: "2026-10-25", daily: 0 },
    ],
    new Date("2026-10-18T00:00Z"),
    new Date("2026-10-24T12:00Z"),
    3,
  );
  assert.equal(data.length, 8);
  assert.equal(data[0].day, "2026-10-17");
  assert.equal(
    data.reduce((s, d) => s + d.daily, 0),
    3,
  );
});
