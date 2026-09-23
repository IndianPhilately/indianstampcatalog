"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/themes", label: "Themes", match: (p: string) => p.startsWith("/themes") },
];

export default function HeaderNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className={
        mobile
          ? "sm:hidden flex items-center gap-3"
          : "hidden sm:flex items-center gap-5 text-sm font-medium shrink-0"
      }
      aria-label="Main Navigation"
    >
      {NAV_LINKS.map(({ href, label, match }) => {
        const isActive = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`pb-0.5 transition shrink-0 ${
              mobile ? "text-xs font-semibold" : ""
            } ${
              isActive
                ? "text-blue-700 border-b-2 border-blue-600 font-bold"
                : "text-slate-600 hover:text-blue-700"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}