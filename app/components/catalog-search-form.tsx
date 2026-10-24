"use client";

import { useRouter } from "next/navigation";
import type { FormEvent, KeyboardEvent } from "react";

const MAX_QUERY_LENGTH = 200;

export default function CatalogSearchForm() {
  const router = useRouter();

  const navigateToSearch = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    navigateToSearch(String(formData.get("q") ?? ""));
  };

  const submitOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    navigateToSearch(event.currentTarget.value);
  };

  return (
    <form
      action="/search"
      method="GET"
      onSubmit={submitSearch}
      className="relative w-full sm:w-60 md:w-72"
      role="search"
    >
      <label htmlFor="globalSearchInput" className="sr-only">
        Search catalog
      </label>
      <input
        type="search"
        name="q"
        id="globalSearchInput"
        maxLength={MAX_QUERY_LENGTH}
        placeholder="Search catalog..."
        onKeyDown={submitOnEnter}
        className="w-full text-xs text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-blue-600 transition"
        required
      />
      <button
        type="submit"
        aria-label="Submit catalogue search"
        className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700"
      >
        <svg
          className="w-3.5 h-3.5"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </form>
  );
}
