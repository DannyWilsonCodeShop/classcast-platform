/**
 * Client-side spreadsheet parser for problem bank import.
 * Supports CSV (via Papa Parse) and XLS/XLSX (via SheetJS).
 */

import { ParsedSpreadsheet } from '@/types/problemBank';

const HEADER_PATTERNS = ['problem', 'question', '#', 'number', 'item', 'prompt'];

function isHeaderRow(row: string): boolean {
  const lower = row.toLowerCase().trim();
  return HEADER_PATTERNS.some(pattern => lower === pattern || lower.startsWith(pattern));
}

/**
 * Parses a CSV or XLS/XLSX file into an array of problem text strings.
 * Uses the first column of each row as the problem content.
 * Skips empty rows and detected header rows.
 */
export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  const errors: string[] = [];
  let rows: string[] = [];

  const fileName = file.name.toLowerCase();
  const isCSV = fileName.endsWith('.csv');
  const isExcel = fileName.endsWith('.xls') || fileName.endsWith('.xlsx');

  try {
    if (isCSV) {
      rows = await parseCSV(file);
    } else if (isExcel) {
      rows = await parseExcel(file);
    } else {
      errors.push('Unsupported file format. Please use CSV, XLS, or XLSX.');
      return { rows: [], totalRows: 0, errors };
    }
  } catch (err: any) {
    errors.push(`Parse error: ${err.message || 'Unknown error'}`);
    return { rows: [], totalRows: 0, errors };
  }

  // Filter out empty rows and header rows
  const filtered = rows.filter(row => {
    const trimmed = row.trim();
    if (!trimmed) return false;
    if (isHeaderRow(trimmed)) return false;
    return true;
  });

  return {
    rows: filtered,
    totalRows: filtered.length,
    errors,
  };
}

async function parseCSV(file: File): Promise<string[]> {
  const text = await file.text();
  // Simple CSV parsing — split by newlines, take first column
  const lines = text.split(/\r?\n/);
  return lines.map(line => {
    // Handle quoted fields
    if (line.startsWith('"')) {
      const endQuote = line.indexOf('"', 1);
      if (endQuote > 0) return line.substring(1, endQuote);
    }
    // Take content before first comma
    const commaIdx = line.indexOf(',');
    return commaIdx >= 0 ? line.substring(0, commaIdx) : line;
  });
}

async function parseExcel(file: File): Promise<string[]> {
  // Dynamic import to avoid bundling SheetJS for all users
  try {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });
    // Extract first column from each row
    return data.map((row: any[]) => String(row[0] || ''));
  } catch {
    // If SheetJS not available, fall back to treating as CSV
    return parseCSV(file);
  }
}
