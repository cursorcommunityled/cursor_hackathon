import * as XLSX from "xlsx";

export type UserIdUrlRow = { userId: string; url: string };

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

function findUserIdColumnIndex(headerRow: string[]): number {
  const labels = ["user_id", "userid", "user", "id"];
  for (let i = 0; i < headerRow.length; i++) {
    const n = normalizeHeader(headerRow[i] ?? "");
    if (labels.includes(n)) return i;
  }
  return -1;
}

function findUrlColumnIndex(headerRow: string[]): number {
  const labels = ["url", "link", "links", "credit_url", "full_url"];
  for (let i = 0; i < headerRow.length; i++) {
    const n = normalizeHeader(headerRow[i] ?? "");
    if (labels.includes(n)) return i;
  }
  return -1;
}

/**
 * Parse Excel: requires columns user_id (or id/user) and url (or link).
 * Dedupes duplicate URLs and duplicate user ids (first row wins for each user).
 */
export function parseUserIdUrlRowsFromExcel(buffer: Buffer): {
  rows: UserIdUrlRow[];
  rawRowCount: number;
  dedupedRowCount: number;
} {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) {
    return { rows: [], rawRowCount: 0, dedupedRowCount: 0 };
  }

  const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as (string | number)[][];

  if (data.length < 2) {
    return { rows: [], rawRowCount: 0, dedupedRowCount: 0 };
  }

  const headerRow = data[0]?.map((c) => String(c).trim()) ?? [];
  let userCol = findUserIdColumnIndex(headerRow);
  let urlCol = findUrlColumnIndex(headerRow);

  if (userCol < 0 && urlCol < 0) {
    userCol = 0;
    urlCol = 1;
  } else if (userCol < 0) {
    userCol = urlCol === 0 ? 1 : 0;
  } else if (urlCol < 0) {
    urlCol = userCol === 0 ? 1 : 0;
  }

  const raw: UserIdUrlRow[] = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    const uid = row[userCol] !== undefined && row[userCol] !== null ? String(row[userCol]).trim() : "";
    const url =
      row[urlCol] !== undefined && row[urlCol] !== null ? String(row[urlCol]).trim() : "";
    if (!uid || !url) continue;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      continue;
    }
    raw.push({ userId: uid, url });
  }

  const rawRowCount = raw.length;

  const seenUrls = new Set<string>();
  const byUser = new Map<string, string>();
  for (const { userId, url } of raw) {
    const urlKey = url.toLowerCase();
    if (seenUrls.has(urlKey)) continue;
    seenUrls.add(urlKey);
    if (!byUser.has(userId)) {
      byUser.set(userId, url);
    }
  }

  const rows: UserIdUrlRow[] = Array.from(byUser.entries()).map(([userId, url]) => ({
    userId,
    url,
  }));

  return {
    rows,
    rawRowCount,
    dedupedRowCount: rows.length,
  };
}
