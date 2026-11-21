export const TEMPLATE_FIELDS = [
  {
    key: "company",
    label: "Company Name",
    required: true,
    example: "ABC Hospitals Pvt Ltd",
  },
  {
    key: "contact",
    label: "Contact Person",
    required: true,
    example: "Mr. Rajesh Kumar",
  },
  {
    key: "designation",
    label: "Designation",
    required: true,
    example: "Purchase Manager",
  },
  {
    key: "phone",
    label: "Phone Number",
    required: true,
    example: "+91 98765 43210",
  },
  { key: "location", label: "Location", required: true, example: "Hyderabad" },
  { key: "industry", label: "Industry", required: true, example: "Healthcare" },
  { key: "source", label: "Lead Source", required: true, example: "Web" },
  {
    key: "email",
    label: "Email",
    required: false,
    example: "rajesh@abchospitals.com",
  },
  {
    key: "website",
    label: "Website",
    required: false,
    example: "www.abchospitals.com",
  },
  {
    key: "linkedin",
    label: "LinkedIn Profile",
    required: false,
    example: "linkedin.com/in/rajeshkumar",
  },
  {
    key: "companySize",
    label: "Company Size",
    required: false,
    example: "201-500",
  },
  {
    key: "department",
    label: "Department",
    required: false,
    example: "Procurement",
  },
  {
    key: "notes",
    label: "Notes",
    required: false,
    example: "Met at MedExpo 2026",
  },
];

export const MAX_FILE_MB = 5;
export const ACCEPTED_EXT = ["xlsx", "xls", "csv"];

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ALIASES = {};
for (const f of TEMPLATE_FIELDS) ALIASES[norm(f.label)] = f.key;
Object.assign(ALIASES, {
  company: "company",
  companyentity: "company",
  contact: "contact",
  contactname: "contact",
  phone: "phone",
  mobile: "phone",
  source: "source",
  linkedin: "linkedin",
  email: "email",
  emailaddress: "email",
});

export function fileExtension(name) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function checkFile(file) {
  if (!ACCEPTED_EXT.includes(fileExtension(file.name)))
    return "Only .xlsx, .xls or .csv files are supported.";
  if (file.size > MAX_FILE_MB * 1024 * 1024)
    return `File is larger than ${MAX_FILE_MB} MB.`;
  if (file.size === 0) return "The file is empty.";
  return null;
}

/** Turn a sheet (array of rows) into upload rows, mapping template headers to fields. */
export function rowsFromSheet(aoa) {
  const headerIdx = aoa.findIndex((r) =>
    r.some(
      (c) =>
        ALIASES[norm(String(c ?? "").replace(/\*|\(.*?\)/g, ""))] === "company",
    ),
  );
  if (headerIdx < 0)
    return {
      rows: [],
      missingColumns: TEMPLATE_FIELDS.filter((f) => f.required).map(
        (f) => f.label,
      ),
    };
  const header = (aoa[headerIdx] ?? []).map(
    (c) => ALIASES[norm(String(c ?? "").replace(/\*|\(.*?\)/g, ""))],
  );
  const missingColumns = TEMPLATE_FIELDS.filter(
    (f) => f.required && !header.includes(f.key),
  ).map((f) => f.label);
  const rows = [];
  aoa.slice(headerIdx + 1).forEach((r, i) => {
    const values = Object.fromEntries(TEMPLATE_FIELDS.map((f) => [f.key, ""]));
    header.forEach((k, ci) => {
      if (k) values[k] = String(r[ci] ?? "").trim();
    });
    if (Object.values(values).some((v) => v !== ""))
      rows.push({ rowNo: headerIdx + i + 2, values });
  });
  return { rows, missingColumns };
}

export const phoneDigits = (p) =>
  p.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
export const isValidPhone = (p) => /^[6-9]\d{9}$/.test(phoneDigits(p));
export const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e);
const pairKey = (company, contact) =>
  `${norm(company)}|${norm(contact.replace(/^(mr|ms|mrs|dr)\.?\s+/i, ""))}`;

const REQUIRED_MSG = {
  company: "Missing Company Name",
  contact: "Missing Contact Person",
  designation: "Missing Designation",
  phone: "Missing Phone",
  location: "Missing Location",
  industry: "Missing Industry",
  source: "Missing Source",
};

/** Validate rows and flag duplicates inside the file and against existing leads. Nothing is merged. */
export function validateRows(rows, existing) {
  const exPhone = new Map();
  const exEmail = new Map();
  const exPair = new Map();
  for (const l of existing) {
    exPhone.set(phoneDigits(l.phone), l.id);
    if (l.email) exEmail.set(l.email.toLowerCase(), l.id);
    exPair.set(pairKey(l.company, l.contact), l.id);
  }
  const seenPhone = new Map();
  const seenEmail = new Map();
  const seenPair = new Map();

  return rows.map((row) => {
    const v = row.values;
    const errors = [];
    const duplicates = [];
    for (const [k, msg] of Object.entries(REQUIRED_MSG))
      if (!v[k]) errors.push(msg);
    if (v.phone && !isValidPhone(v.phone)) errors.push("Invalid phone number");
    if (v.email && !isValidEmail(v.email)) errors.push("Invalid email");

    const ph = v.phone ? phoneDigits(v.phone) : "";
    const em = v.email.toLowerCase();
    const pk = v.company && v.contact ? pairKey(v.company, v.contact) : "";
    if (ph) {
      if (seenPhone.has(ph))
        duplicates.push(`Duplicate phone (same as row ${seenPhone.get(ph)})`);
      else if (exPhone.has(ph))
        duplicates.push(`Phone already exists (lead #${exPhone.get(ph)})`);
      else seenPhone.set(ph, row.rowNo);
    }
    if (em) {
      if (seenEmail.has(em))
        duplicates.push(`Duplicate email (same as row ${seenEmail.get(em)})`);
      else if (exEmail.has(em))
        duplicates.push(`Email already exists (lead #${exEmail.get(em)})`);
      else seenEmail.set(em, row.rowNo);
    }
    if (pk) {
      if (seenPair.has(pk))
        duplicates.push(
          `Duplicate company + contact (same as row ${seenPair.get(pk)})`,
        );
      else if (exPair.has(pk))
        duplicates.push(
          `Company + contact already exists (lead #${exPair.get(pk)})`,
        );
      else seenPair.set(pk, row.rowNo);
    }
    const status = errors.length
      ? "invalid"
      : duplicates.length
        ? "duplicate"
        : "valid";
    return { ...row, errors, duplicates, status };
  });
}

export function summarize(rows) {
  return {
    total: rows.length,
    valid: rows.filter((r) => r.status === "valid").length,
    invalid: rows.filter((r) => r.status === "invalid").length,
    duplicate: rows.filter((r) => r.status === "duplicate").length,
  };
}

/** A realistic sample sheet with a few mistakes, so the workflow can be tried without a file. */
export function sampleSheet() {
  const head = TEMPLATE_FIELDS.map((f) => f.label);
  const base = [
    [
      "Sunshine Multispeciality Hospital",
      "Dr. Anil Menon",
      "Medical Director",
      "+91 98480 11223",
      "Hyderabad",
      "Healthcare",
      "Web",
      "anil@sunshinehospital.in",
    ],
    [
      "Medicover Diagnostics",
      "Ms. Kavitha Rao",
      "Purchase Manager",
      "+91 90001 22334",
      "Bengaluru",
      "Diagnostics",
      "Event",
      "kavitha@medicoverdx.in",
    ],
    [
      "ABC Hospitals Pvt Ltd",
      "Mr. Rajesh Kumar",
      "Managing Director",
      "+91 98765 43210",
      "Hyderabad",
      "Healthcare",
      "Web",
      "rajesh@abchospitals.com",
    ],
    [
      "Smile Dental Studio",
      "Dr. Pooja Shah",
      "Owner",
      "98490 33445",
      "Pune",
      "Dental",
      "Referral",
      "pooja@smiledental",
    ],
    [
      "Clearview Eye Care",
      "Mr. Sandeep Joshi",
      "Operations Head",
      "12345",
      "Mumbai",
      "Ophthalmology",
      "LinkedIn",
      "sandeep@clearvieweye.in",
    ],
    [
      "Greenfield Pharma Ltd",
      "Ms. Ritu Agarwal",
      "Procurement Lead",
      "+91 97012 55667",
      "",
      "Pharmaceuticals",
      "Cold Call",
      "ritu@greenfieldpharma.com",
    ],
    [
      "Medicover Diagnostics",
      "Ms. Kavitha Rao",
      "Purchase Manager",
      "+91 90001 99887",
      "Bengaluru",
      "Diagnostics",
      "Event",
      "",
    ],
    [
      "",
      "Mr. Harsha Vardhan",
      "Administrator",
      "+91 93910 77889",
      "Vijayawada",
      "Healthcare",
      "Web",
      "harsha@cityclinic.in",
    ],
    [
      "Lifeline Wellness Centre",
      "Ms. Meera Nair",
      "CEO",
      "+91 98480 11223",
      "Chennai",
      "Wellness",
      "Referral",
      "meera@lifelinewellness.in",
    ],
  ];
  const cities = ["Hyderabad", "Bengaluru", "Chennai", "Visakhapatnam", "Pune"];
  const kinds = ["Hospital", "Diagnostics", "Clinic", "Pharma", "Labs"];
  const names = [
    "Arvind Rao",
    "Sneha Kulkarni",
    "Vamsi Krishna",
    "Latha Iyer",
    "Imran Khan",
    "Divya Teja",
    "Prasad Reddy",
    "Anjali Desai",
    "Gopal Varma",
    "Nikhil Jain",
    "Swapna Rani",
    "Tarun Sethi",
    "Bhargavi N",
    "Kunal Mehta",
    "Rekha Pillai",
    "Ashok Naidu",
  ];
  names.forEach((n, i) => {
    const kind = kinds[i % kinds.length] ?? "Clinic";
    const first = (n.split(" ")[0] ?? "info").toLowerCase();
    const company = `${["Apex", "Zenith", "Care Plus", "Shree", "Vital", "Orbit", "Elite", "Pristine"][i % 8]} ${kind} ${i + 1}`;
    base.push([
      company,
      `Mr./Ms. ${n}`.replace("Mr./Ms.", i % 2 ? "Ms." : "Mr."),
      "Purchase Manager",
      `+91 9${String(810000000 + i * 7919).slice(0, 4)} ${String(10000 + i * 313).slice(0, 5)}`,
      cities[i % cities.length] ?? "Pune",
      "Healthcare",
      "Web",
      `${first}@${company.toLowerCase().replace(/[^a-z0-9]/g, "")}.in`,
    ]);
  });
  return [
    head,
    ...base.map((r) => [...r, "", "", "", "", ""].slice(0, head.length)),
  ];
}
