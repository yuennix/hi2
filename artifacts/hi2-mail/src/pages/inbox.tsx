import { useEmailState } from "@/hooks/use-email";
import { useGetInbox, getGetInboxQueryKey } from "@workspace/api-client-react";
import { Copy, RefreshCw, Trash2, Mail, Loader2, ChevronRight, Inbox as InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function Inbox() {
  const { email, isGenerating, generateNew } = useEmailState();
  const { toast } = useToast();

  const { data: messages, isLoading: isMessagesLoading, isRefetching } = useGetInbox(
    { email: email || "" },
    {
      query: {
        enabled: !!email,
        refetchInterval: 5000,
        queryKey: getGetInboxQueryKey({ email: email || "" }),
      },
    }
  );

  const copyToClipboard = () => {
    if (email) {
      navigator.clipboard.writeText(email);
      toast({
        title: "COPIED TO CLIPBOARD",
        description: "Address ready for injection.",
        className: "bg-background border-primary text-primary font-mono rounded-none",
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ADDRESS BAR */}
      <div className="bg-card border border-primary/30 p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center relative z-10">
          <div className="space-y-2 w-full text-center md:text-left">
            <h2 className="text-primary/60 text-xs font-semibold tracking-widest uppercase">CURRENT_ASSIGNMENT</h2>
            {isGenerating || !email ? (
              <Skeleton className="h-10 w-full max-w-md bg-primary/20 rounded-none" />
            ) : (
              <div className="text-2xl md:text-3xl font-bold text-primary truncate tracking-tight bg-primary/10 px-4 py-2 border border-primary/20 inline-block w-full max-w-full overflow-x-auto whitespace-nowrap">
                {email}
              </div>
            )}
          </div>
          
          <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
            <Button
              variant="outline"
              className="flex-1 md:flex-none border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground rounded-none rounded-tl-lg rounded-br-lg transition-all"
              onClick={copyToClipboard}
              disabled={!email || isGenerating}
              data-testid="button-copy-email"
            >
              <Copy className="w-4 h-4 mr-2" />
              COPY
            </Button>
            <Button
              variant="outline"
              className="flex-1 md:flex-none border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground rounded-none rounded-tr-lg rounded-bl-lg transition-all"
              onClick={generateNew}
              disabled={isGenerating}
              data-testid="button-generate-email"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
              NEW
            </Button>
          </div>
        </div>
      </div>

      {/* INBOX */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-primary/20 pb-2">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <InboxIcon className="w-5 h-5" />
            INBOX_FEED
          </h3>
          {isRefetching && (
            <span className="text-xs text-primary/70 flex items-center gap-1 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              POLLING...
            </span>
          )}
        </div>

        {isMessagesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-primary/20 p-4 flex gap-4 bg-card/50">
                <Skeleton className="w-10 h-10 rounded-full bg-primary/20 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4 bg-primary/20" />
                  <Skeleton className="h-3 w-1/2 bg-primary/20" />
                </div>
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-2">
            {messages.map((msg) => (
              <Link key={msg.id} href={`/message?messageId=${msg.id}&email=${email}`}>
                <div className="group block border border-primary/20 bg-card p-4 hover:bg-primary/5 hover:border-primary transition-all cursor-pointer relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!msg.isRead && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
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
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-primary/30 p-12 flex flex-col items-center justify-center text-center bg-card/30">
            <div className="w-16 h-16 border-2 border-primary/30 flex items-center justify-center rounded-full mb-4 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
              <Mail className="w-6 h-6 text-primary/70" />
            </div>
            <h4 className="text-primary font-bold text-lg mb-2">AWAITING_TRANSMISSION</h4>
            <p className="text-muted-foreground max-w-md text-sm">
              Your secure inbox is active and listening. Incoming packets will be intercepted and displayed here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
