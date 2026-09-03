export default function FeedLoading() {
  return (
    <div className="grid gap-4">
      <div className="glass flex gap-4 overflow-x-hidden rounded-xl p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex shrink-0 flex-col items-center gap-1">
            <div className="skeleton size-14 rounded-full" />
            <div className="skeleton h-2.5 w-10 rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="skeleton size-10 rounded-full" />
              <div className="grid gap-1.5">
                <div className="skeleton h-3 w-32 rounded-full" />
                <div className="skeleton h-2.5 w-20 rounded-full" />
              </div>
            </div>
            <div className="skeleton aspect-square w-full rounded-xl sm:aspect-video" />
            <div className="skeleton h-3 w-3/4 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
