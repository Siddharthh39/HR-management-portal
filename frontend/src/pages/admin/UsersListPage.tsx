import { useState, useEffect, useCallback } from "react";
import { adminUserApi } from "@/api/admin-user";
import type { User, CreateUserPayload } from "@/types/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorDisplay } from "@/components/shared/ErrorDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search, ChevronLeft, ChevronRight, Users } from "lucide-react";

export default function UsersListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminUserApi.listUsers({ skip, limit });
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, [skip]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (payload: CreateUserPayload) => {
    try {
      await adminUserApi.createUser(payload);
      toast.success("User created successfully");
      setCreateOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to create user");
    }
  };

  if (error) return <ErrorDisplay error={error} onRetry={load} />;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Users"
        description="Manage system users and their access"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Create User</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
              <CreateUserForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Create a user or adjust your search." />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.user_id || u.email}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell><StatusBadge status={u.status || "active"} /></TableCell>
                  <TableCell><StatusBadge status={u.is_admin ? "admin" : "employee"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Showing {skip + 1}–{skip + filtered.length}</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - limit))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={users.length < limit} onClick={() => setSkip(skip + limit)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreateUserForm({ onSubmit }: { onSubmit: (p: CreateUserPayload) => void }) {
  const [form, setForm] = useState<CreateUserPayload>({ full_name: "", email: "", password_hash: "", status: "active", is_admin: false, permission_names: [] });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.full_name.length < 2 || form.full_name.length > 100) { toast.error("Name must be 2-100 chars"); return; }
    if (form.password_hash.length < 8) { toast.error("Password must be at least 8 chars"); return; }
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required minLength={2} maxLength={100} /></div>
      <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
      <div><Label>Password</Label><Input type="password" value={form.password_hash} onChange={e => setForm({ ...form, password_hash: e.target.value })} required minLength={8} /></div>
      <div><Label>Status</Label><Input value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} maxLength={30} /></div>
      <div className="flex items-center gap-2">
        <Switch checked={form.is_admin} onCheckedChange={v => setForm({ ...form, is_admin: v })} />
        <Label>Admin</Label>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Creating…" : "Create User"}</Button>
    </form>
  );
}
