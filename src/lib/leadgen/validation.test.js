import { describe, expect, it } from "vitest";
import { checkFile, rowsFromSheet, sampleSheet, summarize, validateRows } from "./validation";

const existing = [
  {
    id: 1,
    phone: "+91 98765 43210",
    email: "rajesh@abchospitals.com",
    company: "ABC Hospitals Pvt Ltd",
    contact: "Mr. Rajesh Kumar",
  },
];
const head = [
  "Company Name *",
  "Contact Person *",
  "Designation *",
  "Phone Number *",
  "Location *",
  "Industry *",
  "Lead Source *",
  "Email (optional)",
];
const row = (o = {}) => [
  o.c ?? "Apex Clinic",
  o.p ?? "Mr. Arvind Rao",
  "CEO",
  o.ph ?? "+91 99001 12345",
  o.l ?? "Pune",
  "Healthcare",
  "Web",
  o.e ?? "",
];

describe("RA upload validation", () => {
  it("accepts only xlsx, xls and csv files up to 5 MB", () => {
    expect(checkFile({ name: "a.pdf", size: 10 })).not.toBeNull();
    expect(checkFile({ name: "a.csv", size: 6 * 1024 * 1024 })).not.toBeNull();
    expect(checkFile({ name: "a.xlsx", size: 1000 })).toBeNull();
  });

  it("flags missing required fields, invalid phone and invalid email", () => {
    const { rows } = rowsFromSheet([head, row({ l: "", ph: "12345", e: "bad@x" })]);
    const [r] = validateRows(rows, []);
    expect(r?.status).toBe("invalid");
    expect(r?.errors).toEqual(
      expect.arrayContaining(["Missing Location", "Invalid phone number", "Invalid email"]),
    );
  });

  it("flags duplicates inside the file by phone, email and company + contact", () => {
    const { rows } = rowsFromSheet([
      head,
      row({ e: "a@apex.in" }),
      row({ c: "Other Co", p: "Ms. X", e: "a@apex.in", ph: "+91 99001 12345" }),
      row({ ph: "+91 90000 00001" }),
    ]);
    const v = validateRows(rows, []);
    expect(v.map((r) => r.status)).toEqual(["valid", "duplicate", "duplicate"]);
    expect(v[1]?.duplicates.join()).toMatch(/phone/);
    expect(v[2]?.duplicates.join()).toMatch(/company \+ contact/);
  });

  it("flags records that already exist in LeadGen Pro", () => {
    const { rows } = rowsFromSheet([
      head,
      row({ c: "ABC Hospitals Pvt Ltd", p: "Mr. Rajesh Kumar", ph: "98765 43210" }),
    ]);
    expect(validateRows(rows, existing)[0]?.duplicates).toHaveLength(2);
  });

  it("sample sheet produces a mix of valid, invalid and duplicate rows", () => {
    const s = summarize(validateRows(rowsFromSheet(sampleSheet()).rows, existing));
    expect(s.total).toBe(25);
    expect(s.valid + s.invalid + s.duplicate).toBe(25);
    expect(s.invalid).toBeGreaterThan(0);
    expect(s.duplicate).toBeGreaterThan(0);
  });
});
