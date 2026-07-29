import { Coins, Flame, TrendingDown, TrendingUp, Trophy, Wallet } from "lucide-react";
import type { SkillCoinsSummary } from "@skilltego/types";

interface SkillCoinsWalletCardProps {
  summary: SkillCoinsSummary;
}

export function SkillCoinsWalletCard({ summary }: SkillCoinsWalletCardProps) {
  const progressPercent = Math.min(100, Math.round((summary.coinsIntoLevel / summary.coinsPerLevel) * 100));
  const coinsToNextLevel = summary.coinsPerLevel - summary.coinsIntoLevel;

  return (
    <div id="skill-coins-card" className="glass mt-6 scroll-mt-20 overflow-hidden rounded-2xl shadow-sm">
      <div className="gradient-brand p-6 text-white sm:p-8">
        <div className="flex items-center gap-1.5 text-sm font-medium text-white/85">
          <Wallet className="size-4" />
          Current Balance
        </div>
        <div className="mt-2 flex items-end gap-2">
          <Coins className="size-7" />
          <span className="text-4xl font-bold tabular-nums">{summary.balance.toLocaleString()}</span>
          <span className="pb-1 text-sm text-white/85">Skill Coins</span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/85">
            <span>Level {summary.level}</span>
            <span>
              {coinsToNextLevel} coins to level {summary.level + 1}
            </span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        <WalletStat icon={TrendingUp} label="Total Earned" value={summary.totalEarned} />
        <WalletStat icon={TrendingDown} label="Redeemed" value={summary.totalRedeemed} />
        <WalletStat icon={Trophy} label="Level" value={summary.level} />
        <WalletStat icon={Flame} label="Day Streak" value={summary.streakCount} />
      </div>
    </div>
  );
}

function WalletStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1 bg-card p-4 text-center transition-colors hover:bg-accent/40">
      <Icon className="size-4 text-primary" />
      <span className="text-lg font-bold tabular-nums">{value.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
