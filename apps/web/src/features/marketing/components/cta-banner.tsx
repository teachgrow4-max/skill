import Link from "next/link";
import { Button } from "@skilltego/ui";
import { FadeIn } from "./fade-in";

export function CtaBanner() {
  return (
    <section className="px-4 py-20">
      <FadeIn>
        <div className="glass mx-auto max-w-4xl rounded-3xl px-8 py-16 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Your skill is your opportunity.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join Skilltego and start building a profile that actually shows what you can do.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">Create your profile</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/downloads/skilltego.apk" download>
                Download for Android
              </a>
            </Button>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
