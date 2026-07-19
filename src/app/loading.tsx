export default function Loading() {
  return (
    <div
      className="flex min-h-0 flex-1 animate-pulse flex-col gap-4 pt-2"
      role="status"
      aria-label="Loading page"
    >
      <div className="mx-auto h-5 w-3/4 rounded-full bg-[#222222]/10" />
      <div className="mx-auto h-px w-2/3 bg-[#222222]/10" />
      <div className="mt-4 h-12 rounded-full bg-[#E0DBC8]/55" />
      <div className="h-12 rounded-full bg-[#E0DBC8]/35" />
    </div>
  );
}
