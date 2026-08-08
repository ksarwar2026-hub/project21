const shimmer = "animate-pulse bg-[#E5E2E1]";

function SkeletonBlock({ className = "" }) {
  return <div className={`${shimmer} ${className}`} />;
}

export default function HomepageSkeleton() {
  return (
    <main className="overflow-hidden bg-[#FCF9F8] text-[#1E372B]">
      <section className="grid min-h-[52vh] bg-[#F6F3F2] sm:min-h-[55vh] lg:min-h-[70vh] lg:grid-cols-2">
        <div className="flex items-end px-5 py-8 md:px-8 lg:items-center lg:px-20 lg:py-14">
          <div className="w-full max-w-xl">
            <SkeletonBlock className="h-3 w-36 rounded-full" />
            <SkeletonBlock className="mt-5 h-10 w-11/12 rounded-lg sm:h-14" />
            <SkeletonBlock className="mt-3 h-10 w-4/5 rounded-lg sm:h-12" />
            <SkeletonBlock className="mt-6 h-4 w-3/4 rounded-full" />
            <SkeletonBlock className="mt-3 h-4 w-1/2 rounded-full" />
            <SkeletonBlock className="mt-7 h-11 w-40 rounded-full" />
          </div>
        </div>
        <div className="relative hidden bg-[#EFECEC] lg:block">
          <div className="absolute inset-16 rounded-[28px] bg-white/55" />
          <SkeletonBlock className="absolute left-1/2 top-1/2 h-72 w-56 -translate-x-1/2 -translate-y-1/2 rounded-[28px]" />
        </div>
      </section>

      <section className="border-y border-[#E5E2E1] bg-white/60 px-5 py-5 md:px-10 lg:px-20">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <SkeletonBlock className="h-8 w-8 rounded-full" />
              <SkeletonBlock className="h-3 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10 md:py-16 lg:px-20">
        <div className="mx-auto max-w-xl text-center">
          <SkeletonBlock className="mx-auto h-8 w-56 rounded-lg" />
          <SkeletonBlock className="mx-auto mt-3 h-3 w-72 max-w-full rounded-full" />
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="aspect-square rounded-[18px] sm:rounded-[22px]" />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-10 md:px-10 md:py-16 lg:px-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <SkeletonBlock className="h-3 w-28 rounded-full" />
            <SkeletonBlock className="mt-4 h-9 w-72 rounded-lg" />
            <SkeletonBlock className="mt-4 h-4 w-80 max-w-full rounded-full" />
          </div>
          <SkeletonBlock className="hidden h-10 w-28 rounded-full sm:block" />
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-[355px] rounded-[18px] border border-[#E5E2E1] bg-[#FCF9F8] p-2.5 sm:h-[395px] sm:rounded-[22px] lg:h-[435px]"
            >
              <SkeletonBlock className="aspect-square rounded-[15px] sm:rounded-[18px]" />
              <SkeletonBlock className="mt-3 h-4 w-11/12 rounded-full" />
              <SkeletonBlock className="mt-2 h-4 w-3/4 rounded-full" />
              <SkeletonBlock className="mt-4 h-3 w-2/3 rounded-full" />
              <SkeletonBlock className="mt-4 h-9 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#1E372B] px-4 py-12 md:px-8 md:py-16 lg:px-16">
        <div className="mx-auto grid min-h-[430px] max-w-[1440px] overflow-hidden rounded-[28px] bg-white/10 lg:grid-cols-[55%_45%]">
          <SkeletonBlock className="min-h-[260px] bg-white/15 md:min-h-[430px]" />
          <div className="p-6 md:p-10 lg:p-14">
            <SkeletonBlock className="h-3 w-32 rounded-full bg-white/20" />
            <SkeletonBlock className="mt-5 h-10 w-10/12 rounded-lg bg-white/20" />
            <SkeletonBlock className="mt-3 h-10 w-8/12 rounded-lg bg-white/20" />
            <SkeletonBlock className="mt-6 h-4 w-9/12 rounded-full bg-white/20" />
            <SkeletonBlock className="mt-10 h-11 w-40 rounded-full bg-white/20" />
          </div>
        </div>
      </section>
    </main>
  );
}
