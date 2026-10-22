"use client";

export type ViewMode = "grid" | "table";

type ViewToggleProps = {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
};

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="hidden md:inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        aria-label="Switch to Grid View"
        aria-pressed={view === "grid"}
        title="Switch to Grid View"
        onClick={() => onChange("grid")}
        className={`group relative rounded-lg p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
          view === "grid"
            ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        }`}
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-5">
          <path d="M3 3h5v5H3V3Zm9 0h5v5h-5V3ZM3 12h5v5H3v-5Zm9 0h5v5h-5v-5Z" />
        </svg>
        <span className="pointer-events-none absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow transition group-hover:opacity-100 group-focus-visible:opacity-100">
          Switch to Grid View
        </span>
      </button>
      <button
        type="button"
        aria-label="Switch to Table View"
        aria-pressed={view === "table"}
        title="Switch to Table View"
        onClick={() => onChange("table")}
        className={`group relative rounded-lg p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
          view === "table"
            ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
        }`}
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-5">
          <path
            fillRule="evenodd"
            d="M3 3h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm0 2v2h3V5H3Zm5 0v2h9V5H8Zm9 4H8v2h9V9Zm0 4H8v2h9v-2ZM6 9H3v2h3V9Zm-3 4v2h3v-2H3Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="pointer-events-none absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow transition group-hover:opacity-100 group-focus-visible:opacity-100">
          Switch to Table View
        </span>
      </button>
    </div>
  );
}
