import Link from "next/link";

export default function Nav() {
  return (
    <nav className="border-b" style={{ borderColor: "var(--color-border)" }}>
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2 no-underline hover:no-underline">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}
          >
            Prior Art
          </span>
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: "var(--color-text-muted)" }}
          >
            Patent Expiration Monitor
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/browse"
            className="text-sm font-medium no-underline hover:underline"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Browse
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium no-underline hover:underline"
            style={{ color: "var(--color-text-secondary)" }}
          >
            About
          </Link>
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-bg)",
            }}
          >
            Newsletter
          </span>
        </div>
      </div>
    </nav>
  );
}
