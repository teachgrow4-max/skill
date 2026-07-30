import { Award, Calendar, Crown, Flame, Sparkles, Star, Trophy } from "lucide-react";
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
    <div className="flex flex-wrap gap-3">
      {badges.map((badge) => {
        const Icon = ICONS[badge.icon] ?? Award;
        return (
          <div
            key={badge.id}
            title={badge.description}
            className="group flex flex-col items-center gap-1.5 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <span
              className="flex size-14 items-center justify-center rounded-full text-[#3f3f46] shadow-[0_4px_16px_#00000040] ring-1 ring-inset ring-white/40 transition-shadow duration-200 group-hover:shadow-[0_0_24px_#d9d9d966]"
              style={{ background: "radial-gradient(circle at 32% 28%, #f5f5f5, #d9d9d9 55%, #8b8b93)" }}
            >
              <Icon className="size-6" />
            </span>
            <span className="max-w-16 truncate text-center text-[11px] font-medium text-muted-foreground">
              {badge.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
