import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, List, Zap } from "lucide-react";
import { AlertBell } from "@/components/AlertBell";
import { useLogs } from "@/hooks/use-logs";
import { useMemo } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: logs = [] } = useLogs();
  const errorAlerts = useMemo(() => logs.filter((l) => l.level === "ERROR"), [logs]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 flex items-center h-14 gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
              <Zap className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
            </div>
            <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
              LOG<span className="text-primary">_</span>HARMONY
            </span>
          </div>
          <nav className="flex items-center gap-1 ml-4">
            <NavLink
              to="/"
              end
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-150"
              activeClassName="text-foreground bg-secondary/80 shadow-sm"
            >
              <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={1.5} />
              Dashboard
            </NavLink>
            <NavLink
              to="/logs"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-150"
              activeClassName="text-foreground bg-secondary/80 shadow-sm"
            >
              <List className="h-3.5 w-3.5" strokeWidth={1.5} />
              Logs
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <AlertBell alerts={errorAlerts} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}
