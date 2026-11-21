export const TEMPLATE_FIELDS = [
  {
    key: "company",
    label: "Company Name",
    required: true,
    requirement: "Mandatory",
    example: "ABC Hospitals Pvt Ltd",
  },
  {
    key: "category",
    label: "Category",
    required: true,
    requirement: "Assigned categories only",
    example: "Healthcare & Pharma",
  },
  {
    key: "contact",
    label: "Contact Person",
    required: true,
    requirement: "Mandatory if available/required",
    example: "Mr. Rajesh Kumar",
  },
  {
    key: "email",
    label: "Business Email",
    required: false,
    requirement: "Valid format",
    example: "rajesh@abchospitals.com",
  },
  {
    key: "phone",
    label: "Phone Number",
    required: true,
    requirement: "Valid number",
    example: "+91 98765 43210",
  },
  {
    key: "website",
    label: "Website",
    required: false,
    requirement: "Optional",
    example: "https://www.abchospitals.com",
  },
  {
    key: "country",
    label: "Country",
    required: true,
    requirement: "Mandatory",
    example: "India",
  },
  {
    key: "stateCity",
    label: "State / City",
    required: false,
    requirement: "Optional",
    example: "Telangana / Hyderabad",
  },
  {
    key: "companyAddress",
    label: "Company Address",
    required: false,
    requirement: "Optional",
    example: "Road No 12, Banjara Hills, Hyderabad",
  },
  {
    key: "linkedin",
    label: "LinkedIn URL",
    required: false,
    requirement: "Optional",
    example: "https://linkedin.com/company/abchospitals",
  },
  {
    key: "description",
    label: "Description",
    required: false,
    requirement: "Optional",
    example: "Multi-specialty hospital with tertiary care services",
  },
];

export const MAX_FILE_MB = 5;
export const ACCEPTED_EXT = ["xlsx", "xls", "csv"];

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ALIASES = {};
for (const f of TEMPLATE_FIELDS) ALIASES[norm(f.label)] = f.key;
Object.assign(ALIASES, {
  company: "company",
  companyname: "company",
  companyentity: "company",
  organization: "company",

  category: "category",
  domain: "category",
  vertical: "category",
  assignedcategory: "category",
  leadcategory: "category",

  contact: "contact",
  contactname: "contact",
  contactperson: "contact",
  person: "contact",
  name: "contact",

  email: "email",
  businessemail: "email",
  workemail: "email",
  emailaddress: "email",

  phone: "phone",
  phonenumber: "phone",
  mobile: "phone",
  contactnumber: "phone",

  website: "website",
  web: "website",
  url: "website",
  site: "website",

  country: "country",
  nation: "country",

  statecity: "stateCity",
  state: "stateCity",
  city: "stateCity",
  stateandcity: "stateCity",
  location: "stateCity",

  companyaddress: "companyAddress",
  address: "companyAddress",
  officeaddress: "companyAddress",
  street: "companyAddress",

  linkedin: "linkedin",
  linkedinurl: "linkedin",
  linkedinprofile: "linkedin",

  description: "description",
  notes: "description",
  note: "description",
  remarks: "description",
  details: "description",
  summary: "description",

  // Legacy mappings to preserve older files
  designation: "designation",
  industry: "industry",
  source: "source",
  companysize: "companySize",
  department: "department",
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
  String(p ?? "")
    .replace(/\D/g, "")
    .replace(/^(91|0)(?=\d{10}$)/, "");

export const isValidPhone = (p) => {
  const clean = String(p ?? "").trim();
  const digits = clean.replace(/\D/g, "");
  return (
    /^[6-9]\d{9}$/.test(phoneDigits(clean)) ||
    (digits.length >= 7 && digits.length <= 15)
  );
};

export const isValidEmail = (e) =>
  /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(e ?? "").trim());

const pairKey = (company, contact) =>
  `${norm(company)}|${norm(contact.replace(/^(mr|ms|mrs|dr)\.?\s+/i, ""))}`;

const REQUIRED_MSG = {
  company: "Missing Company Name",
  category: "Missing Category",
  contact: "Missing Contact Person",
  phone: "Missing Phone Number",
  country: "Missing Country",
};

/** Validate rows and flag duplicates inside the file and against existing leads. Nothing is merged. */
export function validateRows(rows, existing, allowedCategories = null) {
  const exPhone = new Map();
  const exEmail = new Map();
  const exPair = new Map();
  for (const l of existing) {
    if (l.phone) exPhone.set(phoneDigits(l.phone), l.id);
    if (l.email) exEmail.set(String(l.email).toLowerCase(), l.id);
    if (l.company && l.contact) {
      exPair.set(pairKey(l.company, l.contact), l.id);
    }
  }
  const seenPhone = new Map();
  const seenEmail = new Map();
  const seenPair = new Map();

  const allowedSet =
    allowedCategories && allowedCategories.length > 0
      ? new Set(allowedCategories.map((c) => c.toLowerCase().trim()))
      : null;

  return rows.map((row) => {
    const v = row.values;
    const errors = [];
    const duplicates = [];

    for (const [k, msg] of Object.entries(REQUIRED_MSG)) {
      if (!v[k]) errors.push(msg);
    }

    if (v.category && allowedSet) {
      if (!allowedSet.has(v.category.toLowerCase().trim())) {
        errors.push(
          `Category "${v.category}" is not in assigned categories (${allowedCategories.join(", ")})`,
        );
      }
    }

    if (v.phone && !isValidPhone(v.phone)) {
      errors.push("Invalid phone number");
    }

    if (v.email && !isValidEmail(v.email)) {
      errors.push("Invalid business email format");
    }

    const ph = v.phone ? phoneDigits(v.phone) : "";
    const em = v.email ? String(v.email).toLowerCase().trim() : "";
    const pk = v.company && v.contact ? pairKey(v.company, v.contact) : "";

    if (ph) {
      if (seenPhone.has(ph)) {
        duplicates.push(`Duplicate phone (same as row ${seenPhone.get(ph)})`);
      } else if (exPhone.has(ph)) {
        duplicates.push(`Phone already exists (lead #${exPhone.get(ph)})`);
      } else {
        seenPhone.set(ph, row.rowNo);
      }
    }

    if (em) {
      if (seenEmail.has(em)) {
        duplicates.push(`Duplicate email (same as row ${seenEmail.get(em)})`);
      } else if (exEmail.has(em)) {
        duplicates.push(`Email already exists (lead #${exEmail.get(em)})`);
      } else {
        seenEmail.set(em, row.rowNo);
      }
    }

    if (pk) {
      if (seenPair.has(pk)) {
        duplicates.push(
          `Duplicate company + contact (same as row ${seenPair.get(pk)})`,
        );
      } else if (exPair.has(pk)) {
        duplicates.push(
          `Company + contact already exists (lead #${exPair.get(pk)})`,
        );
      } else {
        seenPair.set(pk, row.rowNo);
      }
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

/** A realistic sample sheet adhering to all 11 fields, with valid, invalid, and duplicate rows. */
export function sampleSheet() {
  const head = TEMPLATE_FIELDS.map((f) => f.label);
  const base = [
    [
      "Sunshine Multispeciality Hospital",
      "Healthcare & Pharma",
      "Dr. Anil Menon",
      "anil@sunshinehospital.in",
      "+91 98480 11223",
      "https://sunshinehospital.in",
      "India",
      "Telangana / Hyderabad",
      "Road No 2, Banjara Hills",
      "https://linkedin.com/company/sunshinehospital",
      "Multi-speciality hospital with 200 beds",
    ],
    [
      "Medicover Diagnostics",
      "Healthcare & Pharma",
      "Ms. Kavitha Rao",
      "kavitha@medicoverdx.in",
      "+91 90001 22334",
      "https://medicoverdx.in",
      "India",
      "Karnataka / Bengaluru",
      "Whitefield Main Road",
      "https://linkedin.com/company/medicoverdx",
      "Diagnostic and pathology laboratory chain",
    ],
    [
      "ABC Hospitals Pvt Ltd",
      "Healthcare & Pharma",
      "Mr. Rajesh Kumar",
      "rajesh@abchospitals.com",
      "+91 98765 43210",
      "https://abchospitals.com",
      "India",
      "Telangana / Hyderabad",
      "Hitec City, Madhapur",
      "https://linkedin.com/company/abchospitals",
      "Tertiary care hospital chain",
    ],
    [
      "EduTech Excellence Hub",
      "Students / Education",
      "Prof. Arvind Sharma",
      "arvind@edutechhub.org",
      "+91 98490 22334",
      "https://edutechhub.org",
      "India",
      "Telangana / Hyderabad",
      "Gachibowli Stadium Road",
      "https://linkedin.com/company/edutechhub",
      "Higher education research and training",
    ],
    [
      "Smile Dental Studio",
      "Healthcare & Pharma",
      "Dr. Pooja Shah",
      "pooja@smiledental", // invalid email
      "+91 98490 33445",
      "https://smiledental.in",
      "India",
      "Maharashtra / Pune",
      "FC Road, Shivajinagar",
      "",
      "Cosmetic dentistry clinic",
    ],
    [
      "Clearview Eye Care",
      "Healthcare & Pharma",
      "Mr. Sandeep Joshi",
      "sandeep@clearvieweye.in",
      "12345", // invalid phone
      "https://clearvieweye.in",
      "India",
      "Maharashtra / Mumbai",
      "Andheri West",
      "",
      "Ophthalmology and refractive laser centre",
    ],
    [
      "Greenfield Pharma Ltd",
      "Healthcare & Pharma",
      "Ms. Ritu Agarwal",
      "ritu@greenfieldpharma.com",
      "+91 97012 55667",
      "",
      "", // missing country (Mandatory)
      "Gujarat / Ahmedabad",
      "GIDC Estate",
      "",
      "Formulation and API manufacturer",
    ],
    [
      "Medicover Diagnostics", // duplicate company + contact
      "Healthcare & Pharma",
      "Ms. Kavitha Rao",
      "",
      "+91 90001 99887",
      "",
      "India",
      "Karnataka / Bengaluru",
      "",
      "",
      "Branch enquiries",
    ],
    [
      "", // missing company name (Mandatory)
      "Students / Education",
      "Mr. Harsha Vardhan",
      "harsha@cityclinic.in",
      "+91 93910 77889",
      "",
      "India",
      "Andhra Pradesh / Vijayawada",
      "",
      "",
      "",
    ],
    [
      "Lifeline Wellness Centre",
      "Healthcare & Pharma",
      "Ms. Meera Nair",
      "meera@lifelinewellness.in",
      "+91 98480 11223", // duplicate phone (same as row 1)
      "https://lifelinewellness.in",
      "India",
      "Tamil Nadu / Chennai",
      "Anna Nagar",
      "",
      "Ayurvedic and wellness retreat center",
    ],
  ];

  const cities = ["Hyderabad", "Bengaluru", "Chennai", "Visakhapatnam", "Pune"];
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
  ];

  names.forEach((n, i) => {
    const isHealthcare = i % 2 === 0;
    const cat = isHealthcare ? "Healthcare & Pharma" : "Students / Education";
    const kind = isHealthcare ? "Hospital" : "Academy";
    const first = (n.split(" ")[0] ?? "info").toLowerCase();
    const company = `${["Apex", "Zenith", "Care Plus", "Shree", "Vital", "Orbit", "Elite", "Pristine"][i % 8]} ${kind} ${i + 1}`;
    base.push([
      company,
      cat,
      `Mr./Ms. ${n}`.replace("Mr./Ms.", i % 2 ? "Ms." : "Mr."),
      `${first}@${company.toLowerCase().replace(/[^a-z0-9]/g, "")}.in`,
      `+91 9${String(810000000 + i * 7919).slice(0, 4)} ${String(10000 + i * 313).slice(0, 5)}`,
      `https://www.${company.toLowerCase().replace(/[^a-z0-9]/g, "")}.in`,
      "India",
      cities[i % cities.length] ?? "Pune",
      `Main Street, ${cities[i % cities.length] ?? "Pune"}`,
      `https://linkedin.com/company/${company.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      `Verified lead for ${cat} campaign`,
    ]);
  });

  return [head, ...base];
}
