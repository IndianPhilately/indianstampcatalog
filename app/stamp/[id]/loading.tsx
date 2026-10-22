export default function StampLoading() {
  return (
    <main
      aria-label="Loading stamp details"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full flex-1"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start animate-pulse">
        <section className="lg:col-span-8">
          <article className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-sm">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="h-4 w-36 rounded bg-slate-200" />
              <div className="flex gap-2">
                <div className="h-7 w-20 rounded-lg bg-slate-200" />
                <div className="h-7 w-16 rounded-lg bg-slate-200" />
              </div>
            </div>
            <div className="mb-5 space-y-2">
              <div className="h-7 w-3/4 rounded bg-slate-200" />
              <div className="h-4 w-1/2 rounded bg-slate-200" />
            </div>
            <div className="mb-5 h-80 rounded-xl bg-slate-100" />
            <div className="mb-3 h-5 w-40 rounded bg-slate-200" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
              <div className="h-4 w-2/3 rounded bg-slate-100" />
            </div>
          </article>
        </section>
        <aside className="hidden space-y-6 lg:col-span-4 lg:block">
          <div className="h-96 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm" />
          <div className="h-64 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm" />
        </aside>
      </div>
    </main>
  );
}
