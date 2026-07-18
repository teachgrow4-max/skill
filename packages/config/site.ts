export const siteConfig = {
  name: "Skilltego",
  tagline: "India's Skill Discovery Platform",
  description:
    "Every person has a skill. Every skill deserves an opportunity. Upload skills, get discovered by companies, colleges, and mentors.",
  url: "https://skilltego.com",
  ogImage: "https://skilltego.com/og.png",
  links: {
    github: "https://github.com/skilltego",
  },
  minAge: 13,
} as const;

export const marketingNav = [
  { title: "About", href: "/about" },
  { title: "Features", href: "/features" },
  { title: "Pricing", href: "/pricing" },
  { title: "FAQ", href: "/faq" },
  { title: "Contact", href: "/contact" },
] as const;

export const appNav = [
  { title: "Feed", href: "/feed" },
  { title: "Explore", href: "/explore" },
  { title: "Search", href: "/search" },
  { title: "Bookmarks", href: "/bookmarks" },
] as const;

export const footerNav = {
  product: [
    { title: "Features", href: "/features" },
    { title: "Pricing", href: "/pricing" },
  ],
  company: [
    { title: "About", href: "/about" },
    { title: "FAQ", href: "/faq" },
    { title: "Contact", href: "/contact" },
  ],
  legal: [
    { title: "Privacy Policy", href: "/privacy" },
    { title: "Terms of Service", href: "/terms" },
    { title: "Community Guidelines", href: "/community-guidelines" },
  ],
} as const;
