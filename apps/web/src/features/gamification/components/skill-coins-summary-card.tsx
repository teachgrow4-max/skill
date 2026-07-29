import Link from "next/link";
import { ArrowRight, Coins } from "lucide-react";

interface SkillCoinsSummaryCardProps {
  balance: number;
}

export function SkillCoinsSummaryCard({ balance }: SkillCoinsSummaryCardProps) {
  return (
    <Link
      href="/skill-coins"
      className="glass mt-6 flex items-center justify-between gap-3 rounded-2xl p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span className="gradient-brand flex size-10 shrink-0 items-center justify-center rounded-full text-white shadow-glow">
          <Coins className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">🪙 Skill Coins</p>
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
