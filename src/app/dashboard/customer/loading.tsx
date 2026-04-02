export default function CustomerLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4 animate-pulse">
      {/* Page title skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-40 rounded-xl bg-gray-200" />
        <div className="h-4 w-56 rounded-xl bg-gray-100" />
      </div>

      {/* Card skeleton */}
      <div className="rounded-3xl bg-gray-100 h-40" />
      <div className="rounded-3xl bg-gray-100 h-56" />
      <div className="rounded-3xl bg-gray-100 h-32" />
    </div>
  );
}
