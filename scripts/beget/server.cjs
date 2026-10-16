async function start() {
  const http = await import("node:http");
  const path = await import("node:path");
  const root = path.resolve(__dirname, "../..");
  process.loadEnvFile(path.join(root, ".env.local"));
  process.env.NODE_ENV = "production";
  const { default: next } = await import("next");
  const passenger = typeof PhusionPassenger !== "undefined";
  if (passenger) PhusionPassenger.configure({ autoInstall: false });
  const app = next({ dev: false, dir: root });
  const handle = app.getRequestHandler();
  await app.prepare();
  const server = http.createServer((req, res) => {
    if (new URL(req.url, "http://localhost").pathname === "/__hosting-health") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify({ status: "ok", release: process.env.DEPLOY_COMMIT }));
      return;
    }
    handle(req, res);
  });
  server.on("error", (error) => {
    console.error("Production HTTP server failed:", error.message);
    process.exit(1);
  });
  if (passenger) server.listen("passenger");
  else server.listen(Number(process.env.PORT || 3332), "127.0.0.1");
}

start().catch((error) => {
  console.error("Production application startup failed:", error.message);
  process.exit(1);
});
