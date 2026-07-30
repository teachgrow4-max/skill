"use client";

import { cn } from "@skilltego/utils";
import { useSidebar } from "@/providers/sidebar-provider";

export function SidebarBranding() {
  const { collapsed } = useSidebar();

  return (
    <div className={cn("hidden px-4", !collapsed && "xl:block")}>
      <div className="h-px w-full" style={{ background: "#2a2a2a" }} />
      <div className="flex flex-col items-center gap-1.5 py-3 text-center">
        <span className="text-[11px] font-medium leading-none" style={{ color: "#8a8a8a" }}>
          Powered by
        </span>
        <span className="text-xs font-semibold leading-none" style={{ color: "#d9d9d9" }}>
          TeachGrow
        </span>
      </div>
    </div>
  );
}
