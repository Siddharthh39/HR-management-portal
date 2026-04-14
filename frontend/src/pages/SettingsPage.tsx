import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/AuthContext";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useState, useEffect } from "react";
import { adminUserApi } from "@/api/admin-user";
import { leaveApi, onboardingApi, punchApi, salaryApi } from "@/api/db-query";
import { Activity, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type HealthStatus = "checking" | "healthy" | "error";

interface ServiceHealth {
  name: string;
  status: HealthStatus;
  error?: string;
}

export default function SettingsPage() {
  const { actorEmail, role } = useAuth();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "(not set)";
  const [healthChecks, setHealthChecks] = useState<ServiceHealth[]>([]);

  const checkHealth = async () => {
    const services = [
      { name: "Admin User", fn: adminUserApi.health },
      { name: "Leave Requests", fn: leaveApi.health },
      { name: "Onboarding", fn: onboardingApi.health },
      { name: "Punch In/Out", fn: punchApi.health },
      { name: "Salary Management", fn: salaryApi.health },
    ];
    setHealthChecks(services.map(s => ({ name: s.name, status: "checking" })));

    const results = await Promise.allSettled(services.map(s => s.fn()));
    setHealthChecks(services.map((s, i) => ({
      name: s.name,
      status: results[i].status === "fulfilled" ? "healthy" : "error",
      error: results[i].status === "rejected" ? (results[i] as PromiseRejectedResult).reason?.message : undefined,
    })));
  };

  useEffect(() => { checkHealth(); }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Settings" description="System configuration and health" />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Connection</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">API Base URL</Label>
              <Input value={baseUrl} readOnly className="mt-1 font-mono text-xs" />
            </div>
            <div className="flex gap-3 text-sm">
              <div><Label className="text-xs text-muted-foreground">Actor Email</Label><p className="font-medium">{actorEmail}</p></div>
              <div><Label className="text-xs text-muted-foreground">Role</Label><StatusBadge status={role} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Service Health</CardTitle>
            <Button variant="outline" size="sm" onClick={checkHealth} className="gap-1"><Activity className="h-3.5 w-3.5" />Recheck</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthChecks.map(s => (
                <div key={s.name} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                  <span className="font-medium">{s.name}</span>
                  <div className="flex items-center gap-1.5">
                    {s.status === "checking" && <span className="text-muted-foreground text-xs">Checking…</span>}
                    {s.status === "healthy" && <><CheckCircle className="h-4 w-4 text-success" /><span className="text-xs text-success">Healthy</span></>}
                    {s.status === "error" && <><XCircle className="h-4 w-4 text-destructive" /><span className="text-xs text-destructive" title={s.error}>Error</span></>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Environment Setup</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Set <code className="bg-muted px-1 rounded text-xs font-mono">VITE_API_BASE_URL</code> in your <code className="bg-muted px-1 rounded text-xs font-mono">.env</code> file:</p>
          <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto">
            VITE_API_BASE_URL=https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod
          </pre>
          <p className="text-xs">Common issues: CORS errors (check API Gateway CORS config), 401 (check X-Actor-Email header), 404 (verify base paths).</p>
        </CardContent>
      </Card>
    </div>
  );
}
