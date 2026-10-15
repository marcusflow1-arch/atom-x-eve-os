/** Local UI review only. No authentication bypass or demo route is deployed. */
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";
export async function startSystemsPreview({ port = 4175, handler } = {}) {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
  const server = await createServer({
    root,
    configFile: false,
    appType: "custom",
    optimizeDeps: { entries: ["tools/game5/systems-preview.jsx"] },
    plugins: [react()],
    server: { host: "127.0.0.1", port, strictPort: true },
    logLevel: "error",
  });
  server.middlewares.use(async (req, res, next) => {
    if (handler && req.url?.startsWith("/api/game5/systems")) {
      try {
        const request = new Request(`http://127.0.0.1:${port}${req.url}`, {
          method: req.method,
          headers: req.headers,
          ...(["GET", "HEAD"].includes(req.method)
            ? {}
            : { body: req, duplex: "half" }),
        });
        const reply = await handler(request);
        res.writeHead(reply.status, Object.fromEntries(reply.headers));
        res.end(await reply.text());
      } catch {
        res.statusCode = 503;
        res.end();
      }
      return;
    }
    if (req.url === "/") {
      const html = await server.transformIndexHtml(
        "/",
        '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Game 5 — Local systems review</title><style>body{margin:0}</style></head><body><div id="root"></div><script type="module" src="/tools/game5/systems-preview.jsx"></script></body></html>',
      );
      res.setHeader("Content-Type", "text/html");
      res.end(html);
      return;
    }
    next();
  });
  await server.listen();
  return server;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await startSystemsPreview();
  console.log("Local sandbox: http://127.0.0.1:4175");
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
}
