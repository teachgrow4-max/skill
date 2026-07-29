import { Award, Calendar, Coins, Flame, Gift, Heart, UserPlus, Users, Video } from "lucide-react";

const REWARD_RULES = [
  { icon: Gift, label: "New Account Registration", amount: 5 },
  { icon: Video, label: "Upload First Reel", amount: 25 },
  { icon: Users, label: "Refer a Friend", amount: 20 },
  { icon: Calendar, label: "Daily Login", amount: 2 },
  { icon: UserPlus, label: "Complete Profile", amount: 10 },
  { icon: Heart, label: "Receive First Like", amount: 5 },
  { icon: Award, label: "Reach 100 Likes", amount: 50 },
  { icon: Flame, label: "7-Day Streak", amount: 30 },
  { icon: Flame, label: "30-Day Streak", amount: 150 },
];

export function RewardsRulesList() {
  return (
    <div className="glass mt-6 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="gradient-brand flex size-10 items-center justify-center rounded-full text-white shadow-glow">
          <Coins className="size-5" />
        </span>
        <h2 className="text-lg font-semibold">Skill Coin Rewards Rules</h2>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {REWARD_RULES.map((rule) => (
          <div
            key={rule.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <rule.icon className="size-4" />
              </span>
              <span className="text-sm font-medium">{rule.label}</span>
            </div>
            <span className="whitespace-nowrap rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
              +{rule.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
