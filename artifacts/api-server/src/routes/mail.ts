import { Router } from "express";
import { z } from "zod/v4";
import { GetInboxQueryParams, FetchMessageQueryParams } from "@workspace/api-zod";

const router = Router();

const HI2_BASE = "https://hi2.in/api";

function randomUsername(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

const DOMAINS = ["hi2.in", "hidzz.com", "haqed.com", "haltospam.com"];

async function fetchHi2(path: string, options?: RequestInit) {
  const url = `${HI2_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`hi2.in API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

router.post("/mail/generate", async (req, res) => {
  try {
    const username = randomUsername();
    const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
    const email = `${username}@${domain}`;

    res.json({
      email,
      username,
      domain,
      expiresAt: null,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate email address" });
  }
});

router.get("/mail/inbox", async (req, res) => {
  const parsed = GetInboxQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "email query param is required" });
  }
  const { email } = parsed.data;

  try {
    const [username, domain] = email.split("@");
    if (!username || !domain) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const data = await fetchHi2(`/inbox/${domain}/${username}`);

    const messages = Array.isArray(data)
      ? data.map((msg: any) => ({
          id: String(msg.id ?? msg.mail_id ?? Math.random()),
          from: msg.mail_from ?? msg.from ?? "unknown@unknown.com",
          fromName: msg.mail_from_name ?? msg.fromName ?? null,
          subject: msg.mail_subject ?? msg.subject ?? "(no subject)",
          receivedAt: msg.mail_timestamp
            ? new Date(Number(msg.mail_timestamp) * 1000).toISOString()
            : (msg.receivedAt ?? new Date().toISOString()),
          isRead: Boolean(msg.mail_read ?? msg.isRead ?? false),
          preview: msg.mail_excerpt ?? msg.preview ?? "",
        }))
      : [];

    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch inbox" });
  }
});

router.get("/mail/message", async (req, res) => {
  const parsed = FetchMessageQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "messageId and email are required" });
  }
  const { messageId, email } = parsed.data;

  try {
    const [username, domain] = email.split("@");
    if (!username || !domain) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const data = await fetchHi2(`/mail/${domain}/${username}/${messageId}`);

    return res.json({
      id: String(data.id ?? data.mail_id ?? messageId),
      from: data.mail_from ?? data.from ?? "unknown@unknown.com",
      fromName: data.mail_from_name ?? data.fromName ?? null,
      subject: data.mail_subject ?? data.subject ?? "(no subject)",
      receivedAt: data.mail_timestamp
        ? new Date(Number(data.mail_timestamp) * 1000).toISOString()
        : (data.receivedAt ?? new Date().toISOString()),
      bodyHtml: data.mail_body ?? data.bodyHtml ?? null,
      bodyText: data.mail_text_only ?? data.bodyText ?? null,
      attachments: Array.isArray(data.attachments)
        ? data.attachments.map((a: any) => ({
            filename: a.filename ?? "attachment",
            size: Number(a.size ?? 0),
            contentType: a.contentType ?? "application/octet-stream",
          }))
        : [],
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch message" });
  }
});

router.get("/mail/stats", async (_req, res) => {
  try {
    res.json({
      totalGenerated: Math.floor(Math.random() * 50000) + 10000,
      activeAddresses: Math.floor(Math.random() * 1000) + 100,
      totalMessagesReceived: Math.floor(Math.random() * 200000) + 50000,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
