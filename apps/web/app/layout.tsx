import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prior Art — Patent Expiration Monitor",
  description:
    "Track expiring USPTO patents. Reliable data for lawyers, investors, and researchers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "var(--font-sans)" }}>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8 animate-fade-in">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
