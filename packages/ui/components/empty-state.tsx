import * as React from "react";
import { cn } from "@skilltego/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "glass animate-in fade-in zoom-in grid justify-items-center gap-2 rounded-2xl p-10 text-center shadow-sm duration-300",
        className,
      )}
    >
      {icon && (
        <div className="gradient-premium mb-2 flex size-16 items-center justify-center rounded-full text-deep-accent shadow-sm">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export { EmptyState };
