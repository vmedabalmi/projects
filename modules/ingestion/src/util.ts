/**
 * Ensure a patent ID has the "US" prefix.
 */
export function ensureUSPrefix(patentId: string): string {
  if (/^US/i.test(patentId)) {
    return patentId;
  }
  return `US${patentId}`;
}
