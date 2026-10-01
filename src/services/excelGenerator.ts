import * as XLSX from 'xlsx';
import { StructuredDocument } from '../types/document';

/**
 * Generates an editable Microsoft Excel (.xlsx) workbook from structured OCR data.
 */
export async function generateExcelWorkbook(docData: StructuredDocument): Promise<Blob> {
  const wb = XLSX.utils.book_new();

  // 1. Gather all sheets
  const sheetsToCreate: { name: string; headers: string[]; rows: (string | number)[][] }[] = [];

  // Add tables from spreadsheets array
  if (docData.spreadsheets && docData.spreadsheets.length > 0) {
    docData.spreadsheets.forEach((sheet, idx) => {
      const sanitizedName = sanitizeSheetName(sheet.sheetName || `Table ${idx + 1}`);
      sheetsToCreate.push({
        name: sanitizedName,
        headers: sheet.headers,
        rows: sheet.rows as (string | number)[][],
      });
    });
  }

  // Also collect any table elements from pages that aren't already included
  docData.pages.forEach((page, pIdx) => {
    page.elements.forEach((elem, eIdx) => {
      if (elem.type === 'table') {
        const title = elem.title || `Page ${pIdx + 1} - Table ${eIdx + 1}`;
        const sanitized = sanitizeSheetName(title);
        // Avoid duplicate sheet names
        if (!sheetsToCreate.some((s) => s.name.toLowerCase() === sanitized.toLowerCase())) {
          sheetsToCreate.push({
            name: sanitized,
            headers: elem.headers,
            rows: elem.rows,
          });
        }
      }
    });
  });

  // 2. Overview Sheet
  const overviewRows: (string | number)[][] = [
    ['DOCUMENT METADATA', ''],
    ['Title', docData.documentTitle || 'Untitled Document'],
    ['Total Pages', docData.pageCount || 1],
    ['OCR Confidence', `${Math.round((docData.confidenceScore || 0.95) * 100)}%`],
    ['Language', docData.detectedLanguage || 'Auto-detected'],
    ['Extraction Summary', docData.ocrSummary || 'Structured conversion via OmniDoc AI OCR'],
    ['', ''],
    ['EXTRACTED CONTENT PREVIEW', ''],
  ];

  // Add key-value and paragraph items to overview
  docData.pages.forEach((page) => {
    overviewRows.push([`--- PAGE ${page.pageNumber} ---`, '']);
    page.elements.forEach((el) => {
      if (el.type === 'key-value') {
        overviewRows.push([el.label, el.value]);
      } else if (el.type === 'heading') {
        overviewRows.push([`[H${el.level}] ${el.text}`, '']);
      } else if (el.type === 'paragraph') {
        const fullText = el.runs.map((r) => r.text).join('');
        if (fullText.trim()) {
          overviewRows.push([fullText, '']);
        }
      }
    });
  });

  const overviewWs = XLSX.utils.aoa_to_sheet(overviewRows);
  overviewWs['!cols'] = [{ wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, overviewWs, 'Overview');

  // 3. Add each tabular sheet
  if (sheetsToCreate.length === 0) {
    // If no explicit tables found, put all text into a single Data sheet
    const dataRows: string[][] = [];
    docData.pages.forEach((page) => {
      page.elements.forEach((el) => {
        if (el.type === 'paragraph') {
          dataRows.push([el.runs.map((r) => r.text).join('')]);
        }
      });
    });
    const defaultWs = XLSX.utils.aoa_to_sheet([['Extracted Document Text'], ...dataRows]);
    defaultWs['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, defaultWs, 'Extracted Data');
  } else {
    sheetsToCreate.forEach((sheet) => {
      const aoa: (string | number)[][] = [];

      // Add header row
      if (sheet.headers && sheet.headers.length > 0) {
        aoa.push(sheet.headers);
      }

      // Add data rows, parsing numbers where possible
      (sheet.rows || []).forEach((row) => {
        const formattedRow = row.map((cell) => parseCellValue(cell));
        aoa.push(formattedRow);
      });

      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // Auto calculate column widths
      const colWidths = calculateColWidths(aoa);
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });
  }

  // Generate binary XLSX output
  const wbout = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  });

  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function sanitizeSheetName(name: string): string {
  // Excel limits sheet names to 31 chars and bans \ / ? * : [ ]
  const cleaned = name.replace(/[\\/?*[\]:]/g, '_').trim();
  return cleaned.substring(0, 31) || 'Sheet';
}

function parseCellValue(val: any): string | number {
  if (typeof val === 'number') return val;
  if (!val) return '';

  const str = String(val).trim();

  // Currency pattern e.g. "$1,234.56" or "€ 500" or "-$45.00"
  const currencyMatch = str.match(/^[$€£¥]?\s*(-?\d[\d,]*(?:\.\d+)?)\s*[$€£¥]?$/);
  if (currencyMatch) {
    const rawNum = parseFloat(currencyMatch[1].replace(/,/g, ''));
    if (!isNaN(rawNum)) return rawNum;
  }

  // Pure Number or percentage pattern e.g. "1,250" or "45.2%"
  const cleanNumStr = str.replace(/,/g, '');
  if (/^-?\d+(\.\d+)?$/.test(cleanNumStr)) {
    const num = parseFloat(cleanNumStr);
    if (!isNaN(num)) return num;
  }

  return str;
}

function calculateColWidths(aoa: (string | number)[][]): { wch: number }[] {
  const maxCols = Math.max(...aoa.map((r) => r.length), 1);
  const widths: number[] = new Array(maxCols).fill(12);

  aoa.forEach((row) => {
    row.forEach((cell, colIdx) => {
      const len = String(cell || '').length;
      if (len + 3 > widths[colIdx]) {
        widths[colIdx] = Math.min(len + 3, 50); // cap max width at 50 chars
      }
    });
  });

  return widths.map((w) => ({ wch: Math.max(w, 12) }));
}
