import Link from "next/link";
import { ArrowRight, Coins } from "lucide-react";

interface SkillCoinsSummaryCardProps {
  balance: number;
}

export function SkillCoinsSummaryCard({ balance }: SkillCoinsSummaryCardProps) {
  return (
    <Link
      href="/skill-coins"
      className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-[0_10px_40px_#00000026] transition-transform duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#3f3f46] shadow-[0_2px_8px_#0000004d]"
          style={{ background: "radial-gradient(circle at 35% 30%, #f5f5f5, #d9d9d9 55%, #a1a1aa)" }}
        >
          <Coins className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Skill Coins</p>
          <p className="text-xs text-muted-foreground">
            Current Balance: {balance.toLocaleString()} Skill Coins
          </p>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
        View Rewards
        <ArrowRight className="size-4" />
      </span>
    </Link>
  );
}
