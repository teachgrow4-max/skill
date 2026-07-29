import { Award, Crown, Gift, GraduationCap, Lock, ShoppingBag, Ticket } from "lucide-react";

const REDEMPTION_ITEMS = [
  { icon: Crown, label: "Premium Membership" },
  { icon: ShoppingBag, label: "Shopping Discounts" },
  { icon: Gift, label: "Exclusive Merchandise" },
  { icon: Ticket, label: "Event Passes" },
  { icon: GraduationCap, label: "Learning Resources" },
  { icon: Award, label: "Special Badges" },
];

export function RewardsRedemptionSection() {
  return (
    <div className="glass mt-6 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Rewards & Redemption</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Unlock these with your Skill Coins once redemption launches.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REDEMPTION_ITEMS.map((item) => (
          <div
            key={item.label}
            className="relative flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-4 text-center opacity-70 transition-opacity hover:opacity-100"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <item.icon className="size-5" />
            </span>
            <span className="text-sm font-medium">{item.label}</span>
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              <Lock className="size-3" />
              Coming Soon
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
