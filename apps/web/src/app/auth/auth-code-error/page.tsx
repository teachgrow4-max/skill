import Link from "next/link";
import { Button } from "@skilltego/ui";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">That link didn&apos;t work</h1>
      <p className="max-w-md text-muted-foreground">
        The sign-in link is invalid or has expired. Request a new one and try again.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/login">Back to login</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
