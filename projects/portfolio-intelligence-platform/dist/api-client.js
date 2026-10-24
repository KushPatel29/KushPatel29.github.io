export const SITE = "https://kushpatel.goatcounter.com";
export function statsClient(
  token,
  fetcher = fetch,
  { signal, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {},
) {
  if (!token) throw Error("A read-only key is required.");
  let requests = 0;
  return {
    get requests() {
      return requests;
    },
    async get(route, query) {
      for (let attempt = 0; attempt < 3; attempt++) {
        signal?.throwIfAborted();
        if (requests) await sleep(300);
        signal?.throwIfAborted();
        requests++;
        let response;
        try {
          response = await fetcher(
            `${SITE}/api/v0/stats/${route}?${new URLSearchParams(query)}`,
            {
              headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json",
              },
              credentials: "omit",
              cache: "no-store",
              signal: signal
                ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
                : AbortSignal.timeout(20000),
            },
          );
        } catch (error) {
          if (signal?.aborted) throw error;
          throw Error(
            "Analytics request timed out or could not reach GoatCounter. Check the connection and retry.",
          );
        }
        if (response.status === 401 || response.status === 403)
          throw Error(
            "Access denied. Use a verified-account key with Read statistics permission for kushpatel only.",
          );
        if (
          (response.status === 429 || response.status >= 500) &&
          attempt < 2
        ) {
          const reset = Number(response.headers?.get("X-Rate-Limit-Reset"));
          await sleep(
            Math.min(
              5000,
              Math.max(
                500,
                Number.isFinite(reset) && reset > 0
                  ? reset * 1000
                  : 500 * 2 ** attempt,
              ),
            ),
          );
          continue;
        }
        if (!response.ok)
          throw Error(
            `GoatCounter ${response.status}. Refresh later or open the native dashboard.`,
          );
        try {
          return await response.json();
        } catch {
          throw Error(
            "Invalid JSON received from GoatCounter. No new values were accepted.",
          );
        }
      }
    },
  };
}
