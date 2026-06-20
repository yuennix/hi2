import { useState } from "react";
import { useEmailState, DOMAINS, type Domain } from "@/hooks/use-email";
import { useMailWebSocket } from "@/hooks/use-mail-websocket";
import {
  Copy, Trash2, Mail, Loader2, ChevronRight,
  Wifi, WifiOff, AlertCircle, LogOut, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function Inbox() {
  const { username, domain, activeEmail, connect, disconnect, setUsername, setDomain } =
    useEmailState();
  const { messages, status, markRead, clearMessages } = useMailWebSocket(activeEmail);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [inputUsername, setInputUsername] = useState(username);
  const [inputDomain, setInputDomain] = useState<Domain>(domain);
  const [isChecking, setIsChecking] = useState(false);
  const [takenError, setTakenError] = useState(false);

  const handleConnect = async () => {
    const trimmed = inputUsername.trim();
    if (!trimmed) return;
    setTakenError(false);
    setIsChecking(true);
    try {
      const res = await fetch("/api/mail/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed, domain: inputDomain }),
      });
      const data = await res.json();
      if (data.available === false && data.reason === "taken") {
        setTakenError(true);
        return;
      }
    } catch {
      // network error — proceed anyway
    } finally {
      setIsChecking(false);
    }
    connect(inputUsername, inputDomain);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const copyToClipboard = () => {
    if (activeEmail) {
      navigator.clipboard.writeText(activeEmail);
      toast({
        title: "COPIED TO CLIPBOARD",
        description: "Address ready for injection.",
        className: "bg-background border-primary text-primary font-mono rounded-none",
      });
    }
  };

  const openMessage = (id: string) => {
    markRead(id);
    setLocation(`/message?messageId=${id}&email=${encodeURIComponent(activeEmail ?? "")}`);
  };

  const statusColor =
    status === "connected"
      ? "text-green-400"
      : status === "connecting"
      ? "text-yellow-400"
      : status === "error"
      ? "text-red-400"
      : "text-primary/30";

  const statusLabel =
    status === "connected"
      ? "LIVE"
      : status === "connecting"
      ? "CONNECTING..."
      : status === "error"
      ? "ERROR"
      : "OFFLINE";

  // ── Setup screen ────────────────────────────────────────────────────────────
  if (!activeEmail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-full max-w-md border border-primary/30 bg-card p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary" />

          <div className="space-y-1 text-center">
            <h2 className="text-primary font-bold text-xl tracking-widest">INITIALIZE_INBOX</h2>
            <p className="text-muted-foreground text-xs">
              Enter a username and select a domain to start receiving mail.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-0 border border-primary/30 focus-within:border-primary transition-colors">
              <Input
                value={inputUsername}
                onChange={(e) => { setInputUsername(e.target.value); setTakenError(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleConnect(); }}
                placeholder="username"
                className="border-0 bg-transparent text-primary placeholder:text-primary/30 font-mono rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                data-testid="input-username"
                autoComplete="off"
                spellCheck={false}
              />
              <span className="text-primary/50 px-2 font-bold select-none">@</span>
              <div className="flex">
                {DOMAINS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setInputDomain(d)}
                    data-testid={`button-domain-${d}`}
                    className={`px-3 py-2 text-xs font-mono transition-all border-l border-primary/20 ${
                      inputDomain === d
                        ? "bg-primary text-primary-foreground"
                        : "text-primary/50 hover:text-primary hover:bg-primary/10"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {inputUsername && (
              <div className="text-xs text-primary/50 font-mono">
                &gt; {inputUsername.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "")}@{inputDomain}
              </div>
            )}

            {takenError && (
              <div className="flex items-center gap-2 border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs font-mono text-red-400">
                <XCircle className="w-3 h-3 shrink-0" />
                EMAIL_TAKEN — this address is already in use. Try a different username.
              </div>
            )}

            <Button
              onClick={handleConnect}
              disabled={!inputUsername.trim() || isChecking}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/80 rounded-none font-mono tracking-widest"
              data-testid="button-connect"
            >
              {isChecking ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  CHECKING...
                </span>
              ) : (
                "CONNECT"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active inbox ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ADDRESS BAR */}
      <div className="bg-card border border-primary/30 p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center relative z-10">
          <div className="space-y-2 w-full text-center md:text-left">
            <div className="flex items-center gap-3">
              <h2 className="text-primary/60 text-xs font-semibold tracking-widest uppercase">
                CURRENT_ASSIGNMENT
              </h2>
              <div className={`flex items-center gap-1 text-xs font-mono ${statusColor}`}>
                {status === "connecting" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : status === "connected" ? (
                  <Wifi className="w-3 h-3" />
                ) : (
                  <WifiOff className="w-3 h-3" />
                )}
                {statusLabel}
              </div>
            </div>
            <div
              className="text-2xl md:text-3xl font-bold text-primary truncate tracking-tight bg-primary/10 px-4 py-2 border border-primary/20 inline-block w-full max-w-full overflow-x-auto whitespace-nowrap"
              data-testid="text-active-email"
            >
              {activeEmail}
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 flex-wrap">
            <Button
              variant="outline"
              className="flex-1 md:flex-none border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground rounded-none transition-all"
              onClick={copyToClipboard}
              data-testid="button-copy-email"
            >
              <Copy className="w-4 h-4 mr-2" />
              COPY
            </Button>
            <Button
              variant="outline"
              className="flex-1 md:flex-none border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground rounded-none transition-all"
              onClick={clearMessages}
              data-testid="button-clear-messages"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              CLEAR
            </Button>
            <Button
              variant="outline"
              className="flex-1 md:flex-none border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-none transition-all"
              onClick={handleDisconnect}
              data-testid="button-disconnect"
            >
              <LogOut className="w-4 h-4 mr-2" />
              CHANGE
            </Button>
          </div>
        </div>
      </div>

      {/* INBOX */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-primary/20 pb-2">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <Mail className="w-5 h-5" />
            INBOX_FEED
            {messages.length > 0 && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5">
                {messages.filter((m) => !m.isRead).length > 0
                  ? `${messages.filter((m) => !m.isRead).length} NEW`
                  : messages.length}
              </span>
            )}
          </h3>
          {status === "connecting" && (
            <span className="text-xs text-yellow-400 flex items-center gap-1 animate-pulse font-mono">
              <Loader2 className="w-3 h-3 animate-spin" />
              ESTABLISHING LINK...
            </span>
          )}
          {status === "error" && (
            <span className="text-xs text-red-400 flex items-center gap-1 font-mono">
              <AlertCircle className="w-3 h-3" />
              CONNECTION FAILED
            </span>
          )}
        </div>

        {messages.length > 0 ? (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                data-testid={`card-message-${msg.id}`}
                onClick={() => openMessage(msg.id)}
                className="group block border border-primary/20 bg-card p-4 hover:bg-primary/5 hover:border-primary transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                {!msg.isRead && (
                  <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground truncate">
                        {msg.fromName || msg.from}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto sm:ml-2 whitespace-nowrap">
                        {formatDistanceToNow(new Date(msg.receivedAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-primary/90 font-medium truncate mb-1">
                      {msg.subject || "NO_SUBJECT"}
                    </div>
                    <div className="text-muted-foreground text-xs truncate">
                      {msg.preview}
                    </div>
                  </div>
                  <div className="hidden sm:flex text-primary/30 group-hover:text-primary transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-primary/30 p-12 flex flex-col items-center justify-center text-center bg-card/30">
            <div className="w-16 h-16 border-2 border-primary/30 flex items-center justify-center rounded-full mb-4 relative">
              {status === "connected" && (
                <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
              )}
              <Mail className="w-6 h-6 text-primary/70" />
            </div>
            <h4 className="text-primary font-bold text-lg mb-2">
              {status === "connected" ? "AWAITING_TRANSMISSION" : "OFFLINE"}
            </h4>
            <p className="text-muted-foreground max-w-md text-sm">
              {status === "connected"
                ? `Send any email to ${activeEmail} — it will appear here instantly.`
                : status === "connecting"
                ? "Establishing secure connection..."
                : "Could not connect to the mail server. Try changing your address."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
