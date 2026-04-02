export default function AdminLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-44 rounded-xl bg-white/10" />
          <div className="h-4 w-32 rounded-xl bg-white/5" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-white/10" />
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="h-11 flex-1 rounded-xl bg-white/5 border border-white/10" />
        <div className="h-11 w-24 rounded-xl bg-white/5 border border-white/10" />
        <div className="h-11 w-24 rounded-xl bg-white/5 border border-white/10" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[80, 96, 80, 72, 64].map((w, i) => (
          <div key={i} className="h-9 rounded-xl bg-white/5" style={{ width: w }} />
        ))}
      </div>

      {/* Table rows */}
      <div className="rounded-2xl overflow-hidden border border-white/10">
        <div className="h-11 bg-white/5 border-b border-white/10" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-white/5 flex items-center gap-4 px-5">
            <div className="w-9 h-9 rounded-xl bg-white/10 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-36 rounded bg-white/10" />
              <div className="h-3 w-48 rounded bg-white/5" />
            </div>
            <div className="h-6 w-20 rounded-full bg-white/10 hidden sm:block" />
            <div className="h-6 w-16 rounded-full bg-white/10 hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
