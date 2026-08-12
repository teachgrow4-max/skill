"use client";

import { cn } from "@skilltego/utils";
import { useSidebar } from "@/providers/sidebar-provider";

export function SidebarBranding() {
  const { collapsed } = useSidebar();

  return (
    <div className={cn("hidden", !collapsed && "xl:block")}>
      <div className="mt-3 h-px w-full" style={{ background: "#2a2a2a" }} />
      <div className="flex flex-col gap-0.5 pt-2.5">
        <span className="text-[10px] font-medium leading-none" style={{ color: "#9CA3AF" }}>
          Powered by
        </span>
        <span className="text-[13px] font-bold leading-none" style={{ color: "#4B5563" }}>
          TeachGrow
        </span>
      </div>
    </div>
  );
}
