import { useLocation } from "wouter";
import { useFetchMessage, getFetchMessageQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Clock, User, Download, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function MessageDetail() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const messageId = searchParams.get("messageId");
  const email = searchParams.get("email");

  const { data: message, isLoading, isError } = useFetchMessage(
    { messageId: messageId || "", email: email || "" },
    {
      query: {
        enabled: !!messageId && !!email,
        queryKey: getFetchMessageQueryKey({ messageId: messageId || "", email: email || "" }),
      },
    }
  );

  if (!messageId || !email) {
    return (
      <div className="text-center py-12 border border-destructive/50 bg-destructive/10">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-destructive font-bold text-xl mb-2">INVALID_PARAMETERS</h2>
        <Button variant="outline" className="border-primary text-primary rounded-none" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> RETURN
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground rounded-none"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          BACK_TO_INBOX
        </Button>
      </div>

      {isLoading ? (
        <div className="border border-primary/20 bg-card p-6 space-y-6">
          <div className="space-y-2 border-b border-primary/20 pb-6">
            <Skeleton className="h-8 w-3/4 bg-primary/20" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-1/4 bg-primary/20" />
              <Skeleton className="h-4 w-1/4 bg-primary/20" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full bg-primary/20" />
            <Skeleton className="h-4 w-full bg-primary/20" />
            <Skeleton className="h-4 w-5/6 bg-primary/20" />
            <Skeleton className="h-4 w-4/6 bg-primary/20" />
          </div>
        </div>
      ) : isError || !message ? (
        <div className="border border-destructive/50 p-8 text-center bg-destructive/5">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <h3 className="text-destructive font-bold">DECRYPTION_FAILED</h3>
          <p className="text-destructive/70 text-sm mt-1">Message could not be retrieved from the server.</p>
        </div>
      ) : (
        <div className="border border-primary/30 bg-card shadow-xl shadow-primary/5 relative overflow-hidden">
          {/* Decorative Corner accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary" />
          
          {/* Header */}
          <div className="border-b border-primary/20 p-6 bg-primary/5 space-y-4">
            <h1 className="text-xl md:text-2xl font-bold text-foreground break-words">
              {message.subject || "<NO_SUBJECT>"}
            </h1>
            
            <div className="flex flex-col md:flex-row gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary/80">
                  {message.fromName ? `${message.fromName} <${message.from}>` : message.from}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>{format(new Date(message.receivedAt), "MMM d, yyyy HH:mm:ss")}</span>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="border-b border-primary/20 p-4 bg-background">
              <h3 className="text-xs font-bold text-primary mb-3 flex items-center gap-2">
                <Download className="w-3 h-3" />
                ATTACHMENTS ({message.attachments.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 border border-primary/30 bg-primary/5 text-xs">
                    <FileText className="w-3 h-3 text-primary" />
                    <span className="truncate max-w-[200px]">{att.filename}</span>
                    <span className="text-muted-foreground ml-2">
                      ({(att.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="p-6 min-h-[300px] bg-white text-black font-sans">
            {message.bodyHtml ? (
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: message.bodyHtml }} 
              />
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-sm text-black">
                {message.bodyText || "No content."}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
