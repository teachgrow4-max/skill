import { Coins, Trophy } from "lucide-react";
import type { SkillCoinsSummary } from "@skilltego/types";

interface SkillCoinsCardProps {
  summary: SkillCoinsSummary;
}

export function SkillCoinsCard({ summary }: SkillCoinsCardProps) {
  const progressPercent = Math.min(100, Math.round((summary.coinsIntoLevel / summary.coinsPerLevel) * 100));
  const coinsToNextLevel = summary.coinsPerLevel - summary.coinsIntoLevel;

  return (
    <div id="skill-coins-card" className="glass mt-6 scroll-mt-20 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="gradient-brand flex size-10 items-center justify-center rounded-full text-white shadow-glow">
          <Trophy className="size-5" />
        </span>
        <h2 className="text-lg font-semibold">🏆 Skill Coins Rewards</h2>
      </div>

      <div className="mt-4 flex items-end gap-2">
        <Coins className="size-6 text-secondary" />
        <span className="text-3xl font-bold tabular-nums">{summary.balance.toLocaleString()}</span>
        <span className="pb-1 text-sm text-muted-foreground">Skill Coins</span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Level {summary.level}</span>
          <span>
            {coinsToNextLevel} coins to level {summary.level + 1}
          </span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="gradient-brand h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Earn Skill Coins by completing activities and inviting friends.
      </p>
    </div>
  );
}
