import { useState, useCallback } from "react";

export const DOMAINS = ["hi2.in", "telegmail.com"] as const;
export type Domain = (typeof DOMAINS)[number];

export interface EmailState {
  username: string;
  domain: Domain;
  email: string;
  isConnected: boolean;
}

function loadSaved(): Pick<EmailState, "username" | "domain"> | null {
  try {
    const raw = localStorage.getItem("hi2_email_state");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.username && DOMAINS.includes(parsed.domain)) return parsed;
  } catch {}
  return null;
}

export function useEmailState() {
  const saved = loadSaved();

  const [username, setUsername] = useState<string>(saved?.username ?? "");
  const [domain, setDomain] = useState<Domain>(saved?.domain ?? "hi2.in");
  const [activeEmail, setActiveEmail] = useState<string | null>(() => {
    if (saved) return `${saved.username}@${saved.domain}`;
    return null;
  });

  const connect = useCallback(
    (u: string, d: Domain) => {
      const trimmed = u.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
      if (!trimmed) return;
      const email = `${trimmed}@${d}`;
      setUsername(trimmed);
      setDomain(d);
      setActiveEmail(email);
      localStorage.setItem(
        "hi2_email_state",
        JSON.stringify({ username: trimmed, domain: d })
      );
    },
    []
  );

  const disconnect = useCallback(() => {
    setActiveEmail(null);
    setUsername("");
    localStorage.removeItem("hi2_email_state");
  }, []);

  return {
    username,
    domain,
    activeEmail,
    connect,
    disconnect,
    setUsername,
    setDomain,
  };
}
