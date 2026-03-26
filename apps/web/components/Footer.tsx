import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="border-t mt-16 py-10"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p
              className="text-lg font-bold mb-2"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}
            >
              Prior Art
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Tracking patent expirations so you don&apos;t have to.
              Data sourced from USPTO public APIs.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
              Navigate
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Home</Link>
              <Link href="/browse" className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Browse Patents</Link>
              <Link href="/about" className="text-sm" style={{ color: "var(--color-text-secondary)" }}>About</Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
              Data Sources
            </p>
            <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              <span>PatentsView API</span>
              <span>USPTO Maintenance Fees</span>
              <span>Patent Center ODP</span>
            </div>
          </div>
        </div>
        <div
          className="mt-8 pt-6 border-t text-xs text-center"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
        >
          &copy; {new Date().getFullYear()} Prior Art. Patent data is public domain.
          This site is for informational purposes only and does not constitute legal advice.
        </div>
      </div>
    </footer>
  );
}
