export interface NavLinkItem {
  href: string;
  label: string;
  icon:
    | "home"
    | "explore"
    | "reels"
    | "opportunities"
    | "messages"
    | "skillCoins"
    | "leaderboard"
    | "dashboard"
    | "moderation"
    | "admin";
}

export const PRIMARY_NAV: NavLinkItem[] = [
  { href: "/feed", label: "Home", icon: "home" },
  { href: "/explore", label: "Explore", icon: "explore" },
  { href: "/reels", label: "Reels", icon: "reels" },
  { href: "/opportunities", label: "Opportunities", icon: "opportunities" },
  { href: "/messages", label: "Messages", icon: "messages" },
  { href: "/skill-coins", label: "Skill Coins", icon: "skillCoins" },
  { href: "/leaderboard", label: "Leaderboard", icon: "leaderboard" },
];
