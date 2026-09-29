import Link from "next/link";
import { Compass } from "lucide-react";
import { Button, EmptyState } from "@skilltego/ui";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <EmptyState
        icon={<Compass className="size-7" />}
        title="Page not found"
        description="This page doesn't exist or may have been removed."
        action={
          <Button asChild>
            <Link href="/feed">Go to your feed</Link>
          </Button>
        }
      />
    </div>
  );
}
