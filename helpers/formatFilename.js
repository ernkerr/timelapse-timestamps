// Converts a Date to a filesystem-safe filename
// "2026-01-12T18:48:41.000Z" → "2026-01-12_18-48-41"
export function formatFilename(date) {
  return date
    .toISOString()
    .slice(0, 19)
    .replace("T", "_")
    .replaceAll(":", "-");
}
