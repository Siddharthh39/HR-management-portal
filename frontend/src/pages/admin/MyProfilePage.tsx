import { useState, useEffect, useCallback } from "react";
import { adminUserApi } from "@/api/admin-user";
import type { User } from "@/types/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorDisplay } from "@/components/shared/ErrorDisplay";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCircle, Mail, ShieldCheck } from "lucide-react";

export default function MyProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setUser(await adminUserApi.getMe()); }
    catch (e) { setError(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorDisplay error={error} onRetry={load} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="My Profile" description="Your account information" />
      <Card className="max-w-lg">
        <CardContent className="p-6 space-y-4">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
          ) : user ? (
            <>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{user.full_name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</p>
                </div>
              </div>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={user.status || "active"} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Role</span><StatusBadge status={user.is_admin ? "admin" : "employee"} /></div>
                {user.permission_names && user.permission_names.length > 0 && (
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1 mb-1"><ShieldCheck className="h-3 w-3" />Permissions</span>
                    <div className="flex flex-wrap gap-1">{user.permission_names.map(p => <StatusBadge key={p} status={p} />)}</div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
