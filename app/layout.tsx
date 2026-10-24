import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Roboto } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import HeaderNav from "./components/header-nav";
import CatalogSearchForm from "./components/catalog-search-form";
import { SITE_ALTERNATE_NAME, SITE_NAME, SITE_URL } from "@/lib/site-config";
import "./globals.css";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: "%s | Indian Stamp Catalogue",
  },
  description:
    "Explore India's commemorative postage stamps, browse issues by year, and discover the stories behind India's philatelic heritage.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
  },
  verification: {
    google: "CwH9atfsHaT9QgsWboACs0rdc7edIfmVMNNTz7ZwILw",
  },
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAME,
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.className}>
      <body className="text-slate-900 antialiased min-h-screen flex flex-col bg-[#e9eef5]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c"),
          }}
        />
        {/* Sticky Glassmorphism Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-0 sm:h-20 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-4">
            
            <div className="flex items-center justify-between w-full sm:w-auto gap-3.5">
              <div className="flex items-center gap-3">
                <Image
                  src="https://indianstampcatalog.vercel.app/favicon.ico"
                  alt="Indian Stamp Catalogue Logo"
                  width={40}
                  height={40}
                  sizes="40px"
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
              <CatalogSearchForm />

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