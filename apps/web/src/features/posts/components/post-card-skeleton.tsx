import { Skeleton } from "@skilltego/ui";

export function PostCardSkeleton() {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-10 rounded-full" />
        <div className="grid gap-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-4/5" />
      <Skeleton className="mt-3 aspect-video w-full rounded-lg" />
      <div className="mt-4 flex gap-5">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="ml-auto h-4 w-4" />
      </div>
    </div>
  );
}
