"use client";

import { cn } from "@skilltego/utils";
import { useSidebar } from "@/providers/sidebar-provider";

export function SidebarBranding() {
  const { collapsed } = useSidebar();

  return (
    <div className={cn("hidden w-full px-4", !collapsed && "xl:block")}>
      <div className="h-px w-full" style={{ background: "#2a2a2a" }} />
      <div className="flex w-full flex-col items-center gap-1 pb-5 pt-3.5 text-center">
        <span className="text-[11px] font-medium leading-none" style={{ color: "#9CA3AF" }}>
          Powered by
        </span>
        <span className="text-[13px] font-semibold leading-none" style={{ color: "#6B7280" }}>
          TeachGrow
        </span>
      </div>
    </div>
  );
}
