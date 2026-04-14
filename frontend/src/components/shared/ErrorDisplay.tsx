import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiError } from "@/types/api";

interface ErrorDisplayProps {
  error: ApiError | Error | unknown;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const message = (error as ApiError)?.message || (error as Error)?.message || "An unexpected error occurred.";
  const status = (error as ApiError)?.status;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
      <div className="rounded-xl bg-destructive/10 p-4 mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {status === 401 ? "Authentication Required" : status === 403 ? "Access Denied" : "Something went wrong"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-1">{message}</p>
      {status === 401 && <p className="text-xs text-muted-foreground">Select a demo account from the top bar.</p>}
      {status === 403 && <p className="text-xs text-muted-foreground">Switch to Admin demo account for this action.</p>}
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      )}
    </div>
  );
}
