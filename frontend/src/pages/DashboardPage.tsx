import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { ErrorDisplay } from "@/components/shared/ErrorDisplay";
import { useAuth } from "@/auth/AuthContext";
import { adminUserApi } from "@/api/admin-user";
import { leaveApi, onboardingApi, punchApi, salaryApi } from "@/api/db-query";
import { Users, CalendarDays, ClipboardList, Clock, DollarSign, ShieldCheck, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = [
  "hsl(199, 89%, 38%)", "hsl(38, 92%, 50%)", "hsl(142, 71%, 40%)",
  "hsl(0, 72%, 51%)", "hsl(270, 60%, 50%)", "hsl(199, 89%, 58%)",
];

interface DashMetrics {
  userCount: number;
  leaveTables: number;
  onboardingTables: number;
  punchTables: number;
  salaryTables: number;
}

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [metrics, setMetrics] = useState<DashMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        isAdmin ? adminUserApi.listUsers({ limit: 1 }) : Promise.resolve([]),
        leaveApi.tables(),
        onboardingApi.tables(),
        punchApi.tables(),
        salaryApi.tables(),
      ]);
      const val = (r: PromiseSettledResult<any>) => r.status === "fulfilled" ? r.value : [];
      setMetrics({
        userCount: Array.isArray(val(results[0])) ? val(results[0]).length : 0,
        leaveTables: Array.isArray(val(results[1])) ? val(results[1]).length : 0,
        onboardingTables: Array.isArray(val(results[2])) ? val(results[2]).length : 0,
        punchTables: Array.isArray(val(results[3])) ? val(results[3]).length : 0,
        salaryTables: Array.isArray(val(results[4])) ? val(results[4]).length : 0,
      });
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorDisplay error={error} onRetry={load} />;

  const chartData = metrics ? [
    { name: "Leave", tables: metrics.leaveTables },
    { name: "Onboarding", tables: metrics.onboardingTables },
    { name: "Punch", tables: metrics.punchTables },
    { name: "Salary", tables: metrics.salaryTables },
  ] : [];

  const pieData = metrics ? [
    { name: "Leave", value: metrics.leaveTables || 1 },
    { name: "Onboarding", value: metrics.onboardingTables || 1 },
    { name: "Punch", value: metrics.punchTables || 1 },
    { name: "Salary", value: metrics.salaryTables || 1 },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Dashboard" description="Overview of your HR management system" />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {isAdmin && <KpiCard title="Users" value={metrics?.userCount ?? "—"} icon={Users} loading={loading} subtitle="Registered accounts" />}
        <KpiCard title="Leave Tables" value={metrics?.leaveTables ?? "—"} icon={CalendarDays} loading={loading} subtitle="Discovered tables" />
        <KpiCard title="Onboarding Tables" value={metrics?.onboardingTables ?? "—"} icon={ClipboardList} loading={loading} subtitle="Discovered tables" />
        <KpiCard title="Punch Tables" value={metrics?.punchTables ?? "—"} icon={Clock} loading={loading} subtitle="Discovered tables" />
        <KpiCard title="Salary Tables" value={metrics?.salaryTables ?? "—"} icon={DollarSign} loading={loading} subtitle="Discovered tables" />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Tables by Service</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="tables" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Service Distribution</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }) => name} fontSize={11}>
                  {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Explore Leave Data", path: "/leave-requests/explorer", icon: CalendarDays },
              { label: "Explore Onboarding", path: "/onboarding/explorer", icon: ClipboardList },
              { label: "Explore Punch Records", path: "/punch-in-out/explorer", icon: Clock },
              { label: "Explore Salary Data", path: "/salary-management/explorer", icon: DollarSign },
            ].map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <item.icon className="h-4 w-4 text-primary" />
                {item.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
