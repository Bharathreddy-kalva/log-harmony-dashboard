import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, List } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-6 flex items-center h-12 gap-6">
          <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
            LOG_MON
          </span>
          <nav className="flex items-center gap-1 ml-4">
            <NavLink
              to="/"
              end
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              activeClassName="text-foreground bg-secondary"
            >
              <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={1.5} />
              Dashboard
            </NavLink>
            <NavLink
              to="/logs"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              activeClassName="text-foreground bg-secondary"
            >
              <List className="h-3.5 w-3.5" strokeWidth={1.5} />
              Logs
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}
