import Link from "next/link";
import { siteConfig } from "@skilltego/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--color-primary)_25%,transparent),transparent_45%),radial-gradient(circle_at_80%_80%,color-mix(in_oklch,var(--color-secondary)_22%,transparent),transparent_45%)]"
      />
      <Link href="/" className="mb-8 text-xl font-bold tracking-tight">
        {siteConfig.name}
      </Link>
      <div className="glass w-full max-w-md rounded-2xl p-8 shadow-xl">{children}</div>
    </div>
  );
}
