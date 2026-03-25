"use client";

import { useState, useMemo } from "react";
import PatentCard from "@/components/PatentCard";
import type { PatentDisplayRecord, UrgencyLabel, PatentType } from "@/lib/types";

const URGENCY_OPTIONS: { value: UrgencyLabel | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "CRITICAL", label: "Critical" },
  { value: "WARNING", label: "Warning" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRED", label: "Expired" },
];

const TYPE_OPTIONS: { value: PatentType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "UTILITY", label: "Utility" },
  { value: "DESIGN", label: "Design" },
  { value: "PLANT", label: "Plant" },
];

type SortKey = "expiration" | "daysRemaining" | "confidence";

const PAGE_SIZE = 20;

export default function BrowseClient({ patents }: { patents: PatentDisplayRecord[] }) {
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLabel | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<PatentType | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortKey>("daysRemaining");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let result = patents;
    if (urgencyFilter !== "ALL") {
      result = result.filter((p) => p.editorial.urgencyLabel === urgencyFilter);
    }
    if (typeFilter !== "ALL") {
      result = result.filter((p) => p.patentType === typeFilter);
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "expiration") return a.expirationDate.localeCompare(b.expirationDate);
      if (sortBy === "daysRemaining") return a.daysUntilExpiration - b.daysUntilExpiration;
      return a.confidence.localeCompare(b.confidence);
    });

    return result;
  }, [patents, urgencyFilter, typeFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 style={{ fontFamily: "var(--font-serif)", color: "var(--color-primary)" }}>
          Browse Patents
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          {filtered.length} patent{filtered.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap gap-4 p-4 rounded border"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-card)" }}
      >
        <FilterSelect
          label="Urgency"
          value={urgencyFilter}
          options={URGENCY_OPTIONS}
          onChange={(v) => { setUrgencyFilter(v as UrgencyLabel | "ALL"); setPage(0); }}
        />
        <FilterSelect
          label="Type"
          value={typeFilter}
          options={TYPE_OPTIONS}
          onChange={(v) => { setTypeFilter(v as PatentType | "ALL"); setPage(0); }}
        />
        <FilterSelect
          label="Sort by"
          value={sortBy}
          options={[
            { value: "daysRemaining", label: "Days Remaining" },
            { value: "expiration", label: "Expiration Date" },
            { value: "confidence", label: "Confidence" },
          ]}
          onChange={(v) => setSortBy(v as SortKey)}
        />
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paged.map((p) => (
          <PatentCard key={p.patentId} patent={p} />
        ))}
      </div>

      {paged.length === 0 && (
        <p className="text-center py-12 text-sm" style={{ color: "var(--color-text-muted)" }}>
          No patents match the selected filters.
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-sm px-3 py-1 rounded border disabled:opacity-30"
            style={{ borderColor: "var(--color-border)" }}
          >
            Previous
          </button>
          <span className="text-sm tabular-nums" style={{ color: "var(--color-text-muted)" }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="text-sm px-3 py-1 rounded border disabled:opacity-30"
            style={{ borderColor: "var(--color-border)" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="text-sm border rounded px-2 py-1.5"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg-card)",
          color: "var(--color-text)",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
