/**
 * Generates the Complete Application Field Inventory as an Excel workbook.
 *
 * Usage: node scripts/generate-field-inventory.js
 * Output: docs/EPI_Field_Inventory.xlsx
 *
 * This script is NOT part of the running application. It is a standalone
 * documentation generator that encodes every field across every screen and
 * every database-only column, then writes a styled multi-sheet .xlsx file.
 */

const XLSX = require('xlsx');
const { writeFileSync, mkdirSync } = require('fs');
const { dirname, join } = require('path');
const { screens, fields, dbOnlyFields, summary } = require('./field-inventory-data.cjs');

const OUTPUT_PATH = join(__dirname, '..', 'docs', 'EPI_Field_Inventory.xlsx');

function applyHeaderStyle(ws, headers, data) {
  // Set column widths based on content length
  const colWidths = headers.map((h) => {
    const maxCellLen = Math.max(
      h.length,
      ...data.map((row) => {
        const val = row[h];
        if (val === null || val === undefined) return 0;
        return Math.min(80, String(val).length);
      }),
    );
    return { wch: Math.max(12, Math.min(60, maxCellLen + 2)) };
  });
  ws['!cols'] = colWidths;

  // Freeze the header row
  ws['!freeze'] = { xSplit: '0', ySplit: '1', topLeftCell: 'A2', state: 'frozen', activePane: 'bottomLeft' };
}

function createSheet(data, sheetName) {
  const ws = XLSX.utils.json_to_sheet(data);
  const headers = Object.keys(data[0] || {});
  applyHeaderStyle(ws, headers, data);

  // Style header row: bold font, colored fill
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = ws[cellRef];
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: '1E3A5F' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };
    }
  }

  // Style data rows: wrap text, alternating row colors
  for (let row = 1; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = ws[cellRef];
      if (cell) {
        cell.s = {
          alignment: { vertical: 'top', wrapText: true },
          fill: { fgColor: { rgb: row % 2 === 0 ? 'F1F5F9' : 'FFFFFF' } },
          border: {
            top: { style: 'thin', color: { rgb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
            left: { style: 'thin', color: { rgb: 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: 'E2E8F0' } },
          },
        };
      }
    }
  }

  return ws;
}

function main() {
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: 'EPI Complete Application Field Inventory',
    Subject: 'PMS/CMS Module Field Documentation',
    Author: 'EPI Project Monitoring System',
    CreatedDate: new Date(),
  };

  const wsScreens = createSheet(screens, 'Screen Inventory');
  XLSX.utils.book_append_sheet(wb, wsScreens, 'Screen Inventory');

  const wsFields = createSheet(fields, 'Screen-Visible Fields');
  XLSX.utils.book_append_sheet(wb, wsFields, 'Screen-Visible Fields');

  const wsDbOnly = createSheet(dbOnlyFields, 'Appendix A - DB Only');
  XLSX.utils.book_append_sheet(wb, wsDbOnly, 'Appendix A - DB Only');

  const wsSummary = createSheet(summary, 'Summary');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
  writeFileSync(OUTPUT_PATH, buf);

  console.log(`Field inventory generated: ${OUTPUT_PATH}`);
  console.log(`  Screens: ${screens.length}`);
  console.log(`  Screen-visible fields: ${fields.length}`);
  console.log(`  Database-only fields: ${dbOnlyFields.length}`);
  console.log(`  Total fields: ${fields.length + dbOnlyFields.length}`);
}

main();
