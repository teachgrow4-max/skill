import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@skilltego/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--color-primary)_18%,transparent),transparent_45%),radial-gradient(circle_at_80%_80%,color-mix(in_oklch,var(--color-secondary)_16%,transparent),transparent_45%)]"
      />
      <Link
        href="/"
        className="mb-8 flex animate-in flex-col items-center gap-2 fade-in zoom-in-95 duration-500"
      >
        <Image src="/logo.png" alt={siteConfig.name} width={44} height={44} className="rounded-xl" priority />
        <span className="text-gradient-brand text-xl font-bold tracking-tight">{siteConfig.name}</span>
      </Link>
      <div className="glass w-full max-w-md animate-in rounded-2xl p-8 shadow-[0_10px_40px_#00000059] fade-in zoom-in-95 duration-500">
        {children}
      </div>
    </div>
  );
}
