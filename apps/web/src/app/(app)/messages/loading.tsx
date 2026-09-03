export default function MessagesLoading() {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl p-3">
          <div className="skeleton size-12 shrink-0 rounded-full" />
          <div className="grid flex-1 gap-1.5">
            <div className="skeleton h-3 w-1/2 rounded-full" />
            <div className="skeleton h-2.5 w-2/3 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
