export default function NotificationsLoading() {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="glass flex items-center gap-3 rounded-xl p-3">
          <div className="skeleton size-10 shrink-0 rounded-full" />
          <div className="grid flex-1 gap-1.5">
            <div className="skeleton h-3 w-3/4 rounded-full" />
            <div className="skeleton h-2.5 w-1/3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
