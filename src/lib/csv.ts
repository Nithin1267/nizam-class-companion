// Lightweight CSV helpers used in place of the vulnerable `xlsx` package.
// CSV files open natively in Excel/Google Sheets/Numbers.

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCSV(
  rows: Array<Record<string, unknown>>,
  headers?: string[],
): string {
  if (rows.length === 0) {
    return headers ? headers.join(",") + "\n" : "";
  }
  const cols = headers ?? Object.keys(rows[0]);
  const headerLine = cols.map(escapeCell).join(",");
  const body = rows
    .map((row) => cols.map((c) => escapeCell(row[c])).join(","))
    .join("\n");
  return headerLine + "\n" + body + "\n";
}

export function downloadCSV(filename: string, csv: string): void {
  // Prepend BOM so Excel opens UTF-8 cleanly.
  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}