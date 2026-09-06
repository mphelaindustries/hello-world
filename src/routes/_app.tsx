import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  Building2,
  ChevronLeft,
  FileStack,
  FileText,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  Mail,
  Menu,
  PieChart,
  Radar,
  Search,
  Settings,
  Sparkles,

  Wand2,
  X,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { notifications as mockNotifications } from "@/data/mock";
import {
  getNotifications, isFirebaseConfigured, markAllNotificationsRead, markNotificationRead,
  useLive, type LiveNotification,
} from "@/lib/live-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const mainNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/tenders", label: "Tenders", icon: FileStack },

  { to: "/scraper", label: "Scraper", icon: Radar },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/filler", label: "Tender Filler", icon: Wand2 },
  { to: "/company", label: "Company Profile", icon: Building2 },
  { to: "/emails", label: "Emails", icon: Mail },
  { to: "/templates", label: "Templates", icon: Gauge },
  { to: "/reports", label: "Reports", icon: PieChart },
] as const;

const systemNav = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help", icon: HelpCircle },
] as const;

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: notifications, refresh } = useLive<LiveNotification[]>("notifications", getNotifications, mockNotifications);
  const unreadCount = notifications.filter((n) => !("read" in n) || !n.read).length;

  const readOne = async (id: string) => {
    if (!isFirebaseConfigured) return;
    try {
      await markNotificationRead(id);
      refresh();
    } catch {
      toast.error("Could not update that notification.");
    }
  };

  const readAll = async () => {
    if (!isFirebaseConfigured) {
      toast.error("Connect the backend first so notifications can be updated.");
      return;
    }
    try {
      await markAllNotificationsRead(notifications.filter((n) => !n.read).map((n) => n.id));
      refresh();
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Could not update notifications.");
    }
  };


  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  const nav = (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto p-3">
      <div>
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
            Main
          </p>
        )}
        <ul className="space-y-1">
          {mainNav.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.to)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                title={item.label}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto">
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
            System
          </p>
        )}
        <ul className="space-y-1">
          {systemNav.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.to)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col bg-sidebar transition-[width] lg:flex",
          collapsed ? "w-[68px]" : "w-64",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            T
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">Tender OS</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">Mphela Industries</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="ml-auto rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
        {nav}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <p className="text-sm font-semibold text-sidebar-accent-foreground">Tender OS</p>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-sidebar-foreground">
                <X className="size-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className={cn("flex min-h-screen flex-col transition-[padding]", collapsed ? "lg:pl-[68px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="relative min-w-0 max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search tenders, documents, references..." />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="size-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b border-border px-4 py-2">
                  <span className="text-sm font-semibold">Notifications</span>
                  <Button variant="ghost" size="sm" disabled={unreadCount === 0} onClick={() => void readAll()}>
                    Mark all read
                  </Button>
                </div>
                <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => void readOne(n.id)}
                        className={cn(
                          "w-full px-4 py-3 text-left hover:bg-accent",
                          n.read && "opacity-60",
                        )}
                      >
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                      </button>
                    </li>
                  ))}
                </ul>

              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    LM
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-medium leading-tight">Lufuno Mphela</span>
                    <span className="block text-[11px] text-muted-foreground">Administrator</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>My account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
