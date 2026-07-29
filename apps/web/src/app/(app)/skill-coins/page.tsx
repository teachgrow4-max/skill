import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Coins } from "lucide-react";
import { EmptyState } from "@skilltego/ui";
import { createClient } from "@/lib/supabase/server";
import { getSkillCoinSummaryAction } from "@/features/gamification/actions";
import { RewardsBanner } from "@/features/gamification/components/rewards-banner";
import { SkillCoinsWalletCard } from "@/features/gamification/components/skill-coins-wallet-card";
import { ReferralCard } from "@/features/gamification/components/referral-card";
import { RewardsRulesList } from "@/features/gamification/components/rewards-rules-list";
import { CoinHistoryCard } from "@/features/gamification/components/coin-history-card";
import { RewardsRedemptionSection } from "@/features/gamification/components/rewards-redemption-section";

export const metadata: Metadata = { title: "Skill Coins" };

export default async function SkillCoinsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const summary = await getSkillCoinSummaryAction();

  return (
    <div className="pb-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Coins className="size-6 text-secondary" />
        Skill Coins
      </h1>

      <RewardsBanner />

      {summary ? (
        <>
          <SkillCoinsWalletCard summary={summary} />
          <RewardsRulesList />
          <ReferralCard referralCode={summary.referralCode} totalReferrals={summary.totalReferrals} />
          <CoinHistoryCard history={summary.history} />
        </>
      ) : (
        <EmptyState
          icon={<Coins className="size-6" />}
          title="Rewards are still warming up"
          description="Your balance and history will show up here shortly."
          className="mt-6"
        />
      )}

      <RewardsRedemptionSection />
    </div>
  );
}
