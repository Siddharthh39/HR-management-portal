import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  inactive: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/15 text-warning border-warning/30",
  approved: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  admin: "bg-primary/15 text-primary border-primary/30",
  employee: "bg-secondary text-secondary-foreground border-border",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status.toLowerCase();
  return (
    <Badge variant="outline" className={cn("text-xs font-medium capitalize", variants[key] || "bg-muted text-muted-foreground", className)}>
      {status}
    </Badge>
  );
}
