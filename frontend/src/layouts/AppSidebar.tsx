import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, ShieldCheck, UserCircle, CalendarDays,
  ClipboardList, Clock, DollarSign, Settings, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthContext";
import { useState } from "react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
    ],
  },
  {
    label: "Administration",
    adminOnly: true,
    items: [
      { path: "/admin/users", label: "Users", icon: Users, adminOnly: true },
      { path: "/admin/permissions", label: "Permissions", icon: ShieldCheck, adminOnly: true },
      { path: "/admin/me", label: "My Profile", icon: UserCircle, adminOnly: false },
    ],
  },
  {
    label: "Data Explorer",
    items: [
      { path: "/leave-requests/explorer", label: "Leave Requests", icon: CalendarDays, adminOnly: false },
      { path: "/onboarding/explorer", label: "Onboarding", icon: ClipboardList, adminOnly: false },
      { path: "/punch-in-out/explorer", label: "Punch In/Out", icon: Clock, adminOnly: false },
      { path: "/salary-management/explorer", label: "Salary", icon: DollarSign, adminOnly: false },
    ],
  },
  {
    label: "System",
    items: [
      { path: "/settings", label: "Settings", icon: Settings, adminOnly: false },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200 shrink-0",
      collapsed ? "w-16" : "w-60"
    )}>
      <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
          HR
        </div>
        {!collapsed && <span className="font-semibold text-sm text-sidebar-accent-foreground">HR Portal</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map((group) => {
          if (group.adminOnly && !isAdmin) return null;
          const visibleItems = group.items.filter(i => !i.adminOnly || isAdmin);
          if (!visibleItems.length) return null;
          return (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted mb-1.5">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        title={item.label}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
