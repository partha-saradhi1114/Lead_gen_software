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

export async function downloadTemplate(assignedCategories = null) {
  const XLSX = await loadXlsx();
  const head = TEMPLATE_FIELDS.map((f) =>
    f.required ? `${f.label} *` : `${f.label} (optional)`,
  );
  const ws = XLSX.utils.aoa_to_sheet([
    head,
    TEMPLATE_FIELDS.map((f) => f.example),
  ]);
  ws["!cols"] = TEMPLATE_FIELDS.map((f) => ({
    wch: Math.max(18, (f.example?.length ?? 12) + 2),
  }));

  const catStr =
    assignedCategories && assignedCategories.length > 0
      ? assignedCategories.join(", ")
      : "Healthcare & Pharma, Students / Education, IT & Upskilling, Corporate Training";

  const guide = XLSX.utils.aoa_to_sheet([
    ["LeadGen Pro – Researcher Lead Upload Template"],
    ["Lead Management Plan Specifications"],
    [""],
    ["Field", "Requirement", "Example", "Notes"],
    ...TEMPLATE_FIELDS.map((f) => [
      f.label,
      f.requirement || (f.required ? "Mandatory" : "Optional"),
      f.example,
      f.key === "category" ? `Allowed: ${catStr}` : "",
    ]),
    [""],
    ["Requirements Summary:"],
    ["1. Company Name: Mandatory."],
    [`2. Category: Assigned categories only (${catStr}).`],
    ["3. Contact Person: Mandatory if available/required."],
    ["4. Business Email: Valid format (e.g. name@domain.com)."],
    ["5. Phone Number: Valid number (10-digit mobile or standard phone)."],
    ["6. Country: Mandatory (e.g. India)."],
    [
      "7. State / City, Website, Company Address, LinkedIn URL, Description: Optional.",
    ],
    [""],
    [
      "Note: Do not alter the header names in the first row. Max file size: 5 MB.",
    ],
  ]);
  guide["!cols"] = [{ wch: 20 }, { wch: 22 }, { wch: 34 }, { wch: 45 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  XLSX.utils.book_append_sheet(wb, guide, "Requirements");
  XLSX.writeFile(wb, "LeadGenPro_Lead_Upload_Template.xlsx");
}

export async function exportRows(fileName, sheetName, rows) {
  const XLSX = await loadXlsx();
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}
