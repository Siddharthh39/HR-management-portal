import { useAuth } from "@/auth/AuthContext";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { DemoRole } from "@/types/api";

const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  users: "Users",
  permissions: "Permissions",
  me: "My Profile",
  "leave-requests": "Leave Requests",
  onboarding: "Onboarding",
  "punch-in-out": "Punch In/Out",
  "salary-management": "Salary",
  explorer: "Explorer",
  settings: "Settings",
};

export function TopBar() {
  const { role, actorEmail, switchAccount } = useAuth();
  const location = useLocation();

  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: breadcrumbMap[seg] || seg,
    path: "/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 gap-4 shrink-0">
      <nav className="flex items-center gap-1 text-sm min-w-0">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
        {crumbs.map((c, i) => (
          <span key={c.path} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-foreground truncate">{c.label}</span>
            ) : (
              <Link to={c.path} className="text-muted-foreground hover:text-foreground transition-colors truncate">{c.label}</Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3 shrink-0">
        <StatusBadge status={role} />
        <Select value={role} onValueChange={(v) => switchAccount(v as DemoRole)}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin Demo</SelectItem>
            <SelectItem value="employee">Employee Demo</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground hidden md:block">{actorEmail}</span>
      </div>
    </header>
  );
}
