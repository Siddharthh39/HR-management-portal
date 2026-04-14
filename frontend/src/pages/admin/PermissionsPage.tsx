import { useState, useEffect, useCallback } from "react";
import { adminUserApi } from "@/api/admin-user";
import type { Permission, CreatePermissionPayload, AssignPermissionsPayload } from "@/types/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorDisplay } from "@/components/shared/ErrorDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, ShieldCheck } from "lucide-react";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await adminUserApi.listPermissions();
      setPermissions(Array.isArray(data) ? data : []);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (payload: CreatePermissionPayload) => {
    try {
      await adminUserApi.createPermission(payload);
      toast.success("Permission created");
      setCreateOpen(false);
      load();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const handleAssign = async (userId: string, names: string[]) => {
    try {
      await adminUserApi.assignPermissions(userId, { permission_names: names });
      toast.success("Permissions assigned");
      setAssignOpen(false);
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  if (error) return <ErrorDisplay error={error} onRetry={load} />;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Permissions"
        description="Manage system permissions"
        actions={
          <div className="flex gap-2">
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm">Assign to User</Button></DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Assign Permissions</DialogTitle></DialogHeader>
                <AssignForm permissions={permissions} onSubmit={handleAssign} />
              </DialogContent>
            </Dialog>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Create</Button></DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Create Permission</DialogTitle></DialogHeader>
                <CreateForm onSubmit={handleCreate} />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : permissions.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No permissions" description="Create your first permission." />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map(p => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.description || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function CreateForm({ onSubmit }: { onSubmit: (p: CreatePermissionPayload) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ name, description: desc || null }); }} className="space-y-4">
      <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={100} /></div>
      <div><Label>Description</Label><Input value={desc} onChange={e => setDesc(e.target.value)} /></div>
      <Button type="submit" className="w-full">Create Permission</Button>
    </form>
  );
}

function AssignForm({ permissions, onSubmit }: { permissions: Permission[]; onSubmit: (userId: string, names: string[]) => void }) {
  const [userId, setUserId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (name: string) => {
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(userId, selected); }} className="space-y-4">
      <div><Label>User ID</Label><Input value={userId} onChange={e => setUserId(e.target.value)} required placeholder="Enter user UUID" /></div>
      <div>
        <Label>Permissions</Label>
        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
          {permissions.map(p => (
            <label key={p.name} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted rounded px-2 py-1">
              <input type="checkbox" checked={selected.includes(p.name)} onChange={() => toggle(p.name)} className="rounded" />
              {p.name}
            </label>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={!userId || selected.length === 0}>Assign</Button>
    </form>
  );
}
