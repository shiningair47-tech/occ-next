"use client";

function SkeletonBar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-neutral-200 ${className ?? ""}`} />;
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
      <div className="bg-[#faf8f3] border-b border-neutral-200 px-4 py-3">
        <div className="flex gap-8">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonBar key={i} className="h-3 w-16" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-8 px-4 py-4 border-b border-neutral-100">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBar key={c} className={c === 0 ? "h-4 w-24" : "h-4 w-12"} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-neutral-200 rounded-lg p-4">
          <SkeletonBar className="h-9 w-9 mb-4" />
          <SkeletonBar className="h-3 w-20 mb-2" />
          <SkeletonBar className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-neutral-200 rounded-lg p-5">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-start gap-3">
              <SkeletonBar className="h-9 w-9 rounded-md" />
              <div>
                <SkeletonBar className="h-5 w-28 mb-1" />
                <SkeletonBar className="h-4 w-16" />
              </div>
            </div>
          </div>
          <SkeletonBar className="h-10 w-full mb-3" />
          <SkeletonBar className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
