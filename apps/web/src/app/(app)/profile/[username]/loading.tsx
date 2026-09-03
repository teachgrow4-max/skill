export default function ProfileLoading() {
  return (
    <div>
      <div className="skeleton -mx-4 h-48 rounded-b-3xl sm:h-64" />
      <div className="pb-6">
        <div className="-mt-16 flex items-end justify-between sm:-mt-20">
          <div className="skeleton size-28 rounded-full border-4 border-background sm:size-32" />
          <div className="skeleton h-10 w-28 rounded-full" />
        </div>
        <div className="mt-4 grid gap-2">
          <div className="skeleton h-5 w-48 rounded-full" />
          <div className="skeleton h-3.5 w-32 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 rounded-2xl border border-border bg-card p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid justify-items-center gap-1.5">
            <div className="skeleton size-9 rounded-full" />
            <div className="skeleton h-3 w-6 rounded-full" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="skeleton aspect-square rounded-md" />
        ))}
      </div>
    </div>
  );
}
