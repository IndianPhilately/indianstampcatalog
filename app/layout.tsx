import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import HeaderNav from "./components/header-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stamp Catalogue",
  description: "DaakTicket India - Online resource and reference for Indian postage stamps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="text-slate-900 antialiased min-h-screen flex flex-col bg-[#e9eef5]">
        {/* Sticky Glassmorphism Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-0 sm:h-20 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-4">
            
            <div className="flex items-center justify-between w-full sm:w-auto gap-3.5">
              <div className="flex items-center gap-3">
                <img 
                  src="https://indianstampcatalog.vercel.app/favicon.ico" 
                  alt="Indian Stamp Catalogue Logo" 
                  className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded shrink-0"
                />
                <div>
                  <Link 
                    href="/" 
                    className="text-base sm:text-2xl font-bold tracking-tight text-slate-950 hover:text-blue-700 transition leading-tight block"
                  >
                    Indian Stamp Catalogue
                  </Link>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block">
                    A Philatelic Reference &amp; Archive
                  </p>
                </div>
              </div>

              {/* Mobile Navigation */}
              <HeaderNav mobile />
            </div>

            <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-end">
              <form action="/search" method="GET" className="relative w-full sm:w-60 md:w-72" role="search">
                <label htmlFor="globalSearchInput" className="sr-only">Search catalog</label>
                <input 
                  type="search" 
                  name="q" 
                  id="globalSearchInput"
                  placeholder="Search catalog..." 
                  className="w-full text-xs text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-blue-600 transition"
                  required
                />
                <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </form>

              {/* Desktop Navigation */}
              <HeaderNav />
            </div>

          </div>
        </header>

        <div className="flex-1 flex flex-col">
          {children}
        </div>

        <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          &copy; Indian Stamp Catalogue. All rights reserved.
        </footer>

        <Analytics />
      </body>
    </html>
  );
}