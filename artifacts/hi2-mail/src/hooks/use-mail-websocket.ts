import { useState, useEffect, useRef, useCallback } from "react";

export interface MailMessage {
  id: string;
  from: string;
  fromName: string | null;
  subject: string;
  receivedAt: string;
  isRead: boolean;
  preview: string;
  bodyHtml: string | null;
  bodyText: string | null;
  attachments: { filename: string; size: number; contentType: string }[];
}

type WsStatus = "disconnected" | "connecting" | "connected" | "error";

const STORAGE_KEY = (email: string) => `hi2_messages_${email}`;

function loadMessages(email: string): MailMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(email));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveMessages(email: string, messages: MailMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY(email), JSON.stringify(messages.slice(0, 100)));
  } catch {}
}

function parseIncoming(raw: string): MailMessage | null {
  try {
    const data = JSON.parse(raw);

    // hi2.in WebSocket message shape variants
    const mail = data.mail ?? data.message ?? data;

    if (!mail || typeof mail !== "object") return null;
    // Skip error / ping / non-mail frames
    if (data.type === "error" || data.type === "ping" || data.pong) return null;
    // Must have at least a from or subject to be a mail
    if (!mail.mail_from && !mail.from && !mail.subject) return null;

    const id =
      String(mail.mail_id ?? mail.id ?? Date.now());
    const from: string =
      mail.mail_from ?? mail.from ?? "unknown@unknown.com";
    const fromName: string | null =
      mail.mail_from_name ?? mail.fromName ?? null;
    const subject: string =
      mail.mail_subject ?? mail.subject ?? "(no subject)";
    const receivedAt: string = mail.mail_timestamp
      ? new Date(Number(mail.mail_timestamp) * 1000).toISOString()
      : mail.receivedAt ?? new Date().toISOString();
    const bodyHtml: string | null =
      mail.mail_body ?? mail.bodyHtml ?? null;
    const bodyText: string | null =
      mail.mail_text_only ?? mail.bodyText ?? null;
    const preview: string =
      mail.mail_excerpt ??
      mail.preview ??
      (bodyText ? bodyText.slice(0, 120) : "");
    const attachments =
      Array.isArray(mail.attachments)
        ? mail.attachments.map((a: any) => ({
            filename: a.filename ?? "attachment",
            size: Number(a.size ?? 0),
            contentType: a.contentType ?? "application/octet-stream",
          }))
        : [];

    return {
      id,
      from,
      fromName,
      subject,
      receivedAt,
      isRead: false,
      preview,
      bodyHtml,
      bodyText,
      attachments,
    };
  } catch {
    return null;
  }
}

export function useMailWebSocket(email: string | null) {
  const [messages, setMessages] = useState<MailMessage[]>(() =>
    email ? loadMessages(email) : []
  );
  const [status, setStatus] = useState<WsStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const emailRef = useRef<string | null>(email);

  // Reset messages when email changes
  useEffect(() => {
    emailRef.current = email;
    if (email) {
      setMessages(loadMessages(email));
    } else {
      setMessages([]);
    }
  }, [email]);

  useEffect(() => {
    if (!email) {
      setStatus("disconnected");
      return;
    }

    // Close any existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus("connecting");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws?email=${encodeURIComponent(email)}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      setStatus("error");
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      const msg = parseIncoming(event.data);
      if (!msg) return;

      setMessages((prev) => {
        // Deduplicate by id
        if (prev.some((m) => m.id === msg.id)) return prev;
        const next = [msg, ...prev];
        saveMessages(emailRef.current ?? "", next);
        return next;
      });
    };

    ws.onerror = () => {
      setStatus("error");
    };

    ws.onclose = () => {
      setStatus("disconnected");
    };

    return () => {
      ws.close();
    };
  }, [email]);

  const markRead = useCallback(
    (id: string) => {
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === id ? { ...m, isRead: true } : m));
        saveMessages(email ?? "", next);
        return next;
      });
    },
    [email]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    if (email) localStorage.removeItem(STORAGE_KEY(email));
  }, [email]);

  return { messages, status, markRead, clearMessages };
}
