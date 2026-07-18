import { NavLink, Outlet } from "react-router";
import {
  RiBarChartBoxLine,
  RiExchangeDollarLine,
  RiFlashlightLine,
  RiHistoryLine,
  RiPulseLine,
} from "@remixicon/react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { useLiveData } from "@/hooks/liveData";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: RiPulseLine, end: true },
  { to: "/chart", label: "Chart", icon: RiBarChartBoxLine, end: false },
  { to: "/signals", label: "Signals", icon: RiHistoryLine, end: false },
  { to: "/symbols", label: "Tracked Symbols", icon: RiExchangeDollarLine, end: false },
  { to: "/backtest", label: "Backtest", icon: RiFlashlightLine, end: false },
];

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { connected } = useLiveData();

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside className="flex w-60 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-5 py-4">
          <RiPulseLine className="size-5 text-sidebar-primary" />
          <span className="font-heading text-lg font-semibold">Amigo</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 border-t border-sidebar-border px-3 py-3 text-xs">
          <span
            className={cn("size-2 rounded-full", connected ? "bg-chart-2" : "bg-muted-foreground/50")}
            title={connected ? "Live connected" : "Disconnected"}
          />
          <span className="text-sidebar-foreground/70">{connected ? "Live" : "Offline"}</span>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="text-sm text-muted-foreground">{user?.email}</div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              Logout
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
