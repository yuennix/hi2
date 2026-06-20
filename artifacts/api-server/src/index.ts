import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);

// ─── WebSocket Proxy: /api/ws?email=... ↔ wss://ws.checker.in:8443 ───────────
const wss = new WebSocketServer({ server, path: "/api/ws" });

wss.on("connection", (clientWs, req) => {
  const rawUrl = req.url ?? "";
  const url = new URL(rawUrl, "http://localhost");
  const email = url.searchParams.get("email");

  if (!email) {
    clientWs.close(1008, "email param required");
    return;
  }

  logger.info({ email }, "WS client connected, opening upstream");

  const upstream = new WebSocket("wss://ws.checker.in:8443", {
    rejectUnauthorized: false,
  });

  upstream.on("open", () => {
    logger.info({ email }, "Upstream WS open — subscribing");
    // hi2.in expects the email_token (expiry-email-hash).
    // Without a token we try sending just the email address.
    // This works when the upstream server accepts plain email subscriptions.
    upstream.send(email);
  });

  upstream.on("message", (data) => {
    const text = data.toString();
    logger.info({ email, data: text.slice(0, 200) }, "Upstream WS message");
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(text);
    }
  });

  upstream.on("error", (err) => {
    logger.warn({ err: err.message, email }, "Upstream WS error");
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: "error", message: err.message }));
    }
  });

  upstream.on("close", (code, reason) => {
    logger.info({ email, code }, "Upstream WS closed");
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(1000, "upstream closed");
    }
  });

  clientWs.on("message", (data) => {
    // Forward any client messages upstream (e.g. ping)
    if (upstream.readyState === WebSocket.OPEN) {
      upstream.send(data.toString());
    }
  });

  clientWs.on("close", () => {
    logger.info({ email }, "Client WS closed");
    if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
      upstream.close();
    }
  });
});

// ─── HTTP listen ─────────────────────────────────────────────────────────────
server.listen(port, () => {
  logger.info({ port }, "Server listening");
});

server.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});
