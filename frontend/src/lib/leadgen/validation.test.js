import { describe, expect, it } from "vitest";
import {
  checkFile,
  rowsFromSheet,
  sampleSheet,
  summarize,
  validateRows,
  validateMemberPhone,
  validateMemberEmail,
} from "./validation";

const existing = [
  {
    id: 1,
    phone: "+91 98765 43210",
    email: "rajesh@abchospitals.com",
    company: "ABC Hospitals Pvt Ltd",
    contact: "Mr. Rajesh Kumar",
    country: "India",
    category: "Healthcare & Pharma",
  },
];

const head = [
  "Company Name *",
  "Category *",
  "Contact Person *",
  "Business Email",
  "Phone Number *",
  "Website (optional)",
  "Country *",
  "State / City (optional)",
  "Company Address (optional)",
  "LinkedIn URL (optional)",
  "Description (optional)",
];

const row = (o = {}) => [
  o.c ?? "Apex Clinic",
  o.cat ?? "Healthcare & Pharma",
  o.p ?? "Mr. Arvind Rao",
  o.e ?? "",
  o.ph ?? "+91 99001 12345",
  o.web ?? "https://apexclinic.in",
  o.country ?? "India",
  o.sc ?? "Maharashtra / Pune",
  o.addr ?? "FC Road",
  o.li ?? "https://linkedin.com/company/apexclinic",
  o.desc ?? "Leading dental care center",
];

describe("RA upload validation - Lead Management Plan Requirements", () => {
  it("accepts only xlsx, xls and csv files up to 5 MB", () => {
    expect(checkFile({ name: "a.pdf", size: 10 })).not.toBeNull();
    expect(checkFile({ name: "a.csv", size: 6 * 1024 * 1024 })).not.toBeNull();
    expect(checkFile({ name: "a.xlsx", size: 1000 })).toBeNull();
  });

  it("flags missing mandatory fields (Company Name, Country, Category, Contact Person, Phone)", () => {
    const { rows } = rowsFromSheet([
      head,
      row({ c: "", country: "", cat: "", p: "", ph: "12345", e: "bad@x" }),
    ]);
    const [r] = validateRows(rows, []);
    expect(r?.status).toBe("invalid");
    expect(r?.errors).toEqual(
      expect.arrayContaining([
        "Missing Company Name",
        "Missing Country",
        "Missing Category",
        "Missing Contact Person",
        "Invalid phone number",
        "Invalid business email format",
      ]),
    );
  });

  it("enforces assigned categories only", () => {
    const { rows } = rowsFromSheet([
      head,
      row({
        c: "Unassigned Co",
        p: "Dr. A",
        ph: "+91 99001 11111",
        cat: "Unassigned Sector",
      }),
      row({
        c: "Assigned Co",
        p: "Dr. B",
        ph: "+91 99001 22222",
        cat: "Healthcare & Pharma",
      }),
    ]);
    const [r1, r2] = validateRows(
      rows,
      [],
      ["Healthcare & Pharma", "Students / Education"],
    );
    expect(r1?.status).toBe("invalid");
    expect(r1?.errors.join()).toContain("not in assigned categories");
    expect(r2?.status).toBe("valid");
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
      row({
        c: "ABC Hospitals Pvt Ltd",
        p: "Mr. Rajesh Kumar",
        ph: "98765 43210",
      }),
    ]);
    expect(validateRows(rows, existing)[0]?.duplicates).toHaveLength(2);
  });

  it("sample sheet produces a mix of valid, invalid and duplicate rows with 11 fields", () => {
    const s = summarize(
      validateRows(rowsFromSheet(sampleSheet()).rows, existing),
    );
    expect(s.total).toBe(25);
    expect(s.valid + s.invalid + s.duplicate).toBe(25);
    expect(s.invalid).toBeGreaterThan(0);
    expect(s.duplicate).toBeGreaterThan(0);
  });
});

describe("Team Member Creation - Mobile Number and Email Validation Rules", () => {
  describe("validateMemberPhone", () => {
    it("fails when mobile number is empty", () => {
      const res = validateMemberPhone("");
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Mobile number is mandatory");
    });

    it("fails when mobile number contains alphabets", () => {
      const res = validateMemberPhone("98765abc10");
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Mobile number cannot contain alphabets");
    });

    it("fails when mobile number has fewer than 10 digits", () => {
      const res = validateMemberPhone("987654321"); // 9 digits
      expect(res.valid).toBe(false);
      expect(res.error).toContain("must consist of exactly 10 digits");
    });

    it("fails when mobile number has more than 10 digits", () => {
      const res = validateMemberPhone("987654321012"); // 12 digits (not starting with 91)
      expect(res.valid).toBe(false);
      expect(res.error).toContain("must consist of exactly 10 digits");
    });

    it("fails when mobile number does not start with 6, 7, 8, or 9", () => {
      const invalidStarts = ["1234567890", "2345678901", "3456789012", "4567890123", "5678901234"];
      invalidStarts.forEach((num) => {
        const res = validateMemberPhone(num);
        expect(res.valid).toBe(false);
        expect(res.error).toBe("Mobile number must start with 6, 7, 8, or 9");
      });
    });

    it("accepts valid 10-digit mobile numbers starting with 6, 7, 8, or 9", () => {
      const validNumbers = [
        "9876543210",
        "8765432109",
        "7654321098",
        "6543210987",
        "+91 98765 43210",
        "09876543210",
      ];
      validNumbers.forEach((num) => {
        const res = validateMemberPhone(num);
        expect(res.valid).toBe(true);
        expect(res.formatted).toMatch(/^\+91 \d{5} \d{5}$/);
      });
    });
  });

  describe("validateMemberEmail", () => {
    it("fails when email is empty", () => {
      const res = validateMemberEmail("");
      expect(res.valid).toBe(false);
      expect(res.error).toBe("Email address is mandatory");
    });

    it("fails when email is in improper format", () => {
      const badEmails = [
        "user@",
        "user@gmail",
        "user@.com",
        "@gmail.com",
        "user name@gmail.com",
        "user..test@gmail.com",
        "plainaddress",
      ];
      badEmails.forEach((e) => {
        const res = validateMemberEmail(e);
        expect(res.valid).toBe(false);
        expect(res.error).toContain("proper format");
      });
    });

    it("accepts proper valid email / gmail formats", () => {
      const validEmails = [
        "sandeep@gmail.com",
        "priya.m@leadgen.pro",
        "analyst_team123@arahinfotech.com",
        "candidate.lead+filter@domain.co.in",
      ];
      validEmails.forEach((e) => {
        const res = validateMemberEmail(e);
        expect(res.valid).toBe(true);
        expect(res.email).toBe(e);
      });
    });

    it("fails when email already exists in the team", () => {
      const team = [{ email: "priya.m@leadgen.pro" }];
      const res = validateMemberEmail("priya.m@leadgen.pro", team);
      expect(res.valid).toBe(false);
      expect(res.error).toBe("A team member with this email already exists");
    });
  });
});
