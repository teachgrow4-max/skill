export default function ExploreLoading() {
  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="skeleton aspect-square rounded-md" />
      ))}
    </div>
  );
}
