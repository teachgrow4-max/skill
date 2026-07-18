import Link from "next/link";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/moderation", label: "Reports" },
];

export function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-2">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
