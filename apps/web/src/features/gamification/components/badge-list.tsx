import { Award, Calendar, Crown, Flame, Sparkles, Star, Trophy } from "lucide-react";
import { Badge as BadgePill } from "@skilltego/ui";
import type { Badge } from "@skilltego/types";

const ICONS: Record<string, typeof Award> = {
  sparkles: Sparkles,
  flame: Flame,
  star: Star,
  "calendar-check": Calendar,
  trophy: Trophy,
  crown: Crown,
};

export function BadgeList({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const Icon = ICONS[badge.icon] ?? Award;
        return (
          <BadgePill
            key={badge.id}
            variant="secondary"
            title={badge.description}
            className="flex items-center gap-1"
          >
            <Icon className="size-3" />
            {badge.name}
          </BadgePill>
        );
      })}
    </div>
  );
}
