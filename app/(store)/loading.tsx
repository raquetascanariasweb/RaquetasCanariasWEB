export default function Loading() {
  return (
    <div className="min-h-screen bg-paper pt-16">
      <div className="container-main py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white border border-linen/60 overflow-hidden animate-pulse">
              <div className="aspect-square bg-linen/80" />
              <div className="p-4 flex flex-col gap-3">
                <div className="h-4 bg-linen/80 rounded w-3/4" />
                <div className="h-5 bg-linen/80 rounded w-1/3" />
                <div className="h-10 bg-linen/80 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
