"use client";

export default function HomepageSkeleton() {
  return (
    <div className="w-full bg-[#F2F2F2] dark:bg-zinc-950 text-black dark:text-white animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[420px] lg:h-[520px] bg-zinc-300 dark:bg-zinc-800" />

      {/* Marquee skeleton */}
      <div className="h-12 bg-zinc-200 dark:bg-zinc-900 border-b border-black dark:border-zinc-800" />

      {/* Product showcase skeleton */}
      <section className="w-full border-b border-black dark:border-zinc-800">
        <div className="w-[1920px] max-w-full mx-auto">
          <div className="p-8 lg:p-12 border-b border-black dark:border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="h-6 w-32 bg-zinc-300 dark:bg-zinc-800" />
              <div className="h-10 w-72 bg-zinc-300 dark:bg-zinc-800" />
            </div>
            <div className="h-12 w-48 bg-zinc-300 dark:bg-zinc-800" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 border-b border-black dark:border-zinc-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-6 lg:p-8 bg-white dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-16 bg-zinc-300 dark:bg-zinc-800" />
                  <div className="h-5 w-20 bg-zinc-300 dark:bg-zinc-800" />
                </div>
                <div className="aspect-square my-6 bg-zinc-200 dark:bg-zinc-800" />
                <div className="space-y-3 pt-4 border-t border-black/10 dark:border-white/10">
                  <div className="h-4 w-24 bg-zinc-300 dark:bg-zinc-800" />
                  <div className="h-5 w-full bg-zinc-300 dark:bg-zinc-800" />
                  <div className="h-5 w-full bg-zinc-300 dark:bg-zinc-800" />
                  <div className="h-8 w-28 bg-zinc-300 dark:bg-zinc-800" />
                  <div className="h-12 w-full bg-zinc-300 dark:bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Buy by need skeleton */}
      <section className="w-full border-b border-black dark:border-zinc-800">
        <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-12 space-y-4">
          <div className="h-6 w-40 bg-zinc-300 dark:bg-zinc-800" />
          <div className="h-10 w-64 bg-zinc-300 dark:bg-zinc-800" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 bg-zinc-300 dark:bg-zinc-800" />
            ))}
          </div>
        </div>
      </section>

      {/* Categories skeleton */}
      <section className="w-full border-b border-black dark:border-zinc-800">
        <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-12 space-y-6">
          <div className="h-6 w-40 bg-zinc-300 dark:bg-zinc-800" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-zinc-300 dark:bg-zinc-800" />
            ))}
          </div>
        </div>
      </section>

      {/* News skeleton */}
      <section className="w-full border-b border-black dark:border-zinc-800">
        <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-12 space-y-6">
          <div className="h-6 w-40 bg-zinc-300 dark:bg-zinc-800" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[16/10] bg-zinc-300 dark:bg-zinc-800" />
                <div className="h-5 w-full bg-zinc-300 dark:bg-zinc-800" />
                <div className="h-5 w-3/4 bg-zinc-300 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands skeleton */}
      <section className="w-full border-b border-black dark:border-zinc-800">
        <div className="w-[1920px] max-w-full mx-auto p-8 lg:p-12 space-y-6">
          <div className="h-6 w-40 bg-zinc-300 dark:bg-zinc-800" />
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-zinc-300 dark:bg-zinc-800" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}