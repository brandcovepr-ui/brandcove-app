export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 animate-pulse">
      <div className="mb-6 h-12 w-64 rounded-lg bg-gray-200/60 md:mb-8" />

      {/* Stat Cards Skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 md:mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-gray-100 bg-white p-5" />
        ))}
      </div>

      {/* List Skeleton */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-md">
        <div className="mb-4 h-6 w-36 rounded bg-gray-200/60" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 w-full rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  )
}