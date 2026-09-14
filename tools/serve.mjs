import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";

const types = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

const headers = {
  "cache-control": "no-store",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
};

function safePath(pathname) {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, "") || "index.html";
  const candidate = path.resolve(ROOT, relative);
  return candidate === ROOT || candidate.startsWith(ROOT + path.sep) ? candidate : null;
}

async function fileFor(requestPath) {
  let file = safePath(requestPath);
  if (!file) return null;
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    return (await stat(file)).isFile() ? file : null;
  } catch {
    return null;
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || HOST}`);
  const file = await fileFor(url.pathname);

  if (!file) {
    const notFound = await readFile(path.join(ROOT, "404.html"));
    response.writeHead(404, { ...headers, "content-type": "text/html; charset=utf-8" });
    response.end(request.method === "HEAD" ? undefined : notFound);
    return;
  }

  const body = await readFile(file);
  response.writeHead(200, {
    ...headers,
    "content-type": types.get(path.extname(file).toLowerCase()) || "application/octet-stream",
    "content-length": body.length,
  });
  response.end(request.method === "HEAD" ? undefined : body);
});

server.listen(PORT, HOST, () => {
  console.log(`Portfolio test server: http://${HOST}:${PORT}`);
});
