import type { Metadata } from "next";
import Link from "next/link";
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
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Pontano+Sans&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body>
        <div className="header-container">
          <div className="search-bar">
            <form action="/search" method="get">
              <input type="text" name="q" placeholder="Search stamps..." required />
              <button type="submit">Search</button>
            </form>
          </div>

          <div className="header">
            <img src="/header.jpg" alt="Stamp Catalogue Header" className="header-img" />
          </div>

          <div className="nav-wrapper">
            <nav className="nav-bar">
              <Link href="/">Home</Link>
            </nav>
          </div>
        </div>

        <div className="container">{children}</div>
      </body>
    </html>
  );
}
