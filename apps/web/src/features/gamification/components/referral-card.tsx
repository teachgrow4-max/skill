"use client";

import * as React from "react";
import { Check, Copy, Share2, Users } from "lucide-react";
import { Button } from "@skilltego/ui";
import { publicEnv } from "@/lib/env.public";
import { CoinToast } from "./coin-toast";
import { useCoinToast } from "../hooks/use-coin-toast";

interface ReferralCardProps {
  referralCode: string;
  totalReferrals: number;
}

const SEEN_REFERRALS_KEY = "skilltego_seen_total_referrals";

export function ReferralCard({ referralCode, totalReferrals }: ReferralCardProps) {
  const [copied, setCopied] = React.useState(false);
  const { toast, showToast } = useCoinToast();
  const referralLink = `${publicEnv.NEXT_PUBLIC_SITE_URL}/ref/${referralCode}`;

  React.useEffect(() => {
    const seenRaw = window.localStorage.getItem(SEEN_REFERRALS_KEY);
    const seen = seenRaw ? Number(seenRaw) : totalReferrals;
    if (totalReferrals > seen) {
      showToast({
        icon: "👥",
        title: "+20 Skill Coins",
        subtitle: "Your friend joined using your referral link!",
      });
    }
    window.localStorage.setItem(SEEN_REFERRALS_KEY, String(totalReferrals));
    // Only re-run when the server-reported count changes, not when showToast identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalReferrals]);

  async function handleCopy() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Skilltego",
          text: "Join Skilltego with my referral link and we both earn Skill Coins!",
          url: referralLink,
        });
      } catch {
        // User dismissed the native share sheet — nothing to recover from.
      }
    } else {
      await handleCopy();
    }
  }

  return (
    <div id="referral-card" className="glass mt-6 scroll-mt-20 rounded-2xl p-6 shadow-sm">
      <CoinToast toast={toast} />
      <div className="flex items-center gap-2">
        <span className="gradient-brand flex size-10 items-center justify-center rounded-full text-white shadow-glow">
          <Users className="size-5" />
        </span>
        <h2 className="text-lg font-semibold">Invite Friends & Earn Skill Coins</h2>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Share your referral link. When someone signs up using your referral code and creates an account, you
        earn Skill Coins instantly.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">Referral Code</p>
          <p className="mt-1 font-mono text-sm font-semibold tracking-wide">{referralCode}</p>
        </div>
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground">Referral Link</p>
          <p className="mt-1 break-all font-mono text-sm">{referralLink}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={handleCopy} variant="secondary" className="rounded-full">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
        <Button onClick={handleShare} className="gradient-brand rounded-full text-white shadow-glow">
          <Share2 className="size-4" />
          Share
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-accent/50 p-3">
          <p className="text-xl font-bold tabular-nums">{totalReferrals}</p>
          <p className="text-xs text-muted-foreground">Total Referrals</p>
        </div>
        <div className="rounded-xl bg-accent/50 p-3">
          <p className="text-xl font-bold tabular-nums">{(totalReferrals * 20).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Coins Earned from Referrals</p>
        </div>
      </div>
    </div>
  );
}
