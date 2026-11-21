import { TEMPLATE_FIELDS } from "./validation";

// SheetJS is loaded on demand in the browser only.
const loadXlsx = () => import("xlsx");

export async function readSheetFile(file, onProgress) {
  const buf = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) =>
      e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 80));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(file);
  });
  const XLSX = await loadXlsx();
  const wb = XLSX.read(buf, { type: "array" });
  const name = wb.SheetNames[0];
  const ws = name ? wb.Sheets[name] : undefined;
  onProgress?.(100);
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
}

export async function downloadTemplate() {
  const XLSX = await loadXlsx();
  const head = TEMPLATE_FIELDS.map((f) =>
    f.required ? `${f.label} *` : `${f.label} (optional)`,
  );
  const ws = XLSX.utils.aoa_to_sheet([
    head,
    TEMPLATE_FIELDS.map((f) => f.example),
  ]);
  ws["!cols"] = TEMPLATE_FIELDS.map((f) => ({
    wch: Math.max(16, f.example.length + 2),
  }));
  const guide = XLSX.utils.aoa_to_sheet([
    ["LeadGen Pro – Lead Upload Template"],
    [""],
    ["Field", "Required", "Example"],
    ...TEMPLATE_FIELDS.map((f) => [
      f.label,
      f.required ? "Yes" : "No",
      f.example,
    ]),
    [""],
    ["Rules"],
    ["Phone: 10-digit Indian mobile, with or without +91."],
    ["Lead Source: Web, Event, Referral, LinkedIn or Cold Call."],
    ["Do not change the header row. Max 5 MB per file."],
  ]);
  guide["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 34 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  XLSX.utils.book_append_sheet(wb, guide, "Instructions");
  XLSX.writeFile(wb, "LeadGenPro_Lead_Upload_Template.xlsx");
}

export async function exportRows(fileName, sheetName, rows) {
  const XLSX = await loadXlsx();
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}
