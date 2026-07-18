import Link from "next/link";
import { siteConfig, footerNav } from "@skilltego/config";

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="text-lg font-bold">{siteConfig.name}</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">{siteConfig.tagline}</p>
        </div>

        <FooterColumn title="Product" links={footerNav.product} />
        <FooterColumn title="Company" links={footerNav.company} />
        <FooterColumn title="Legal" links={footerNav.legal} />
      </div>

      <div className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: readonly { title: string; href: string }[] }) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 grid gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
