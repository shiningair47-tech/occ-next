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

export function FollowupCardSkeleton({ count = 3 }: { count?: number }) {
  const skeletonCards = Array.from({ length: count });
  const touchpointButtons = Array.from({ length: 7 });
  const timelineItems = Array.from({ length: 3 });

  return (
    <div className="space-y-4">
      {skeletonCards.map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-[#e8e4db] p-5 shadow-sm">
          {/* Header: name + phone on left, date + badge on right */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <SkeletonBar className="h-5 w-40 mb-2" />
              <div className="flex items-center gap-2">
                <SkeletonBar className="h-4 w-28" />
                <SkeletonBar className="h-4 w-14 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <SkeletonBar className="h-7 w-24 rounded-md" />
              <SkeletonBar className="h-7 w-14 rounded-md" />
            </div>
          </div>

          {/* Touchpoints row */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {touchpointButtons.map((_, j) => (
                <SkeletonBar key={j} className="h-7 w-10 rounded-md" />
              ))}
            </div>
          </div>

          {/* Followup Timeline */}
          <div className="space-y-1.5">
            {timelineItems.map((_, k) => (
              <div key={k} className="flex items-center justify-between p-2 rounded-lg bg-[#faf8f3] border border-[#e8e4db]">
                <div className="flex items-center gap-2">
                  <SkeletonBar className="h-3 w-20" />
                  <SkeletonBar className="h-3 w-24" />
                  <SkeletonBar className="h-4 w-14 rounded-full" />
                </div>
                <SkeletonBar className="h-4 w-12 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
