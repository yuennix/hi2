import { useGetMailStats } from "@workspace/api-client-react";
import { Mail, ShieldAlert, Cpu } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { data: stats } = useGetMailStats();

  return (
    <div className="min-h-screen flex flex-col font-mono text-sm">
      <div className="scanline" />
      
      <header className="border-b border-primary/20 bg-background/95 backdrop-blur z-40 sticky top-0">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-wider">
            <Cpu className="w-5 h-5" />
            <span>HI2_MAIL_PROTOCOL</span>
          </div>
          
          <div className="hidden md:flex gap-6 text-muted-foreground text-xs">
            <div className="flex items-center gap-2">
              <span className="text-primary/50">ACTIVE_NODES:</span>
              <span className="text-primary">{stats?.activeAddresses || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary/50">TOTAL_GEN:</span>
              <span className="text-primary">{stats?.totalGenerated || 0}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 relative z-10">
        {children}
      </main>

      <footer className="border-t border-primary/20 py-6 text-center text-xs text-muted-foreground mt-auto relative z-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary/50">
            <ShieldAlert className="w-4 h-4" />
            <span>END-TO-END SECURE TERMINAL</span>
          </div>
          <p>&copy; {new Date().getFullYear()} HI2. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}
