export const LEAD_SOURCES = ["Web", "Event", "Referral", "LinkedIn", "Cold Call"];
export const LEAD_CATEGORIES = [
  "Students / Education",
  "IT & Upskilling",
  "Corporate Training",
  "Healthcare & Pharma",
  "General Enquiries",
];
export const RESEARCHERS = ["Priya M", "Arjun K", "Neha R", "Sneha T", "Rahul P"];
export const REJECTION_REASONS = [
  "Duplicate lead",
  "Invalid phone number",
  "Invalid email address",
  "Outside target segment",
  "Incomplete information",
  "Other",
];

export const CURRENT_RA = "Priya M";
export const INDUSTRIES = [
  "Healthcare",
  "Diagnostics",
  "Pharmaceuticals",
  "Dental",
  "Ophthalmology",
  "Wellness",
];
export const LOCATIONS = [
  "Hyderabad",
  "Bengaluru",
  "Chennai",
  "Vijayawada",
  "Visakhapatnam",
  "Pune",
  "Mumbai",
];
export const DESIGNATIONS = [
  "Managing Director",
  "Purchase Manager",
  "Operations Head",
  "Administrator",
  "CEO",
  "Procurement Lead",
];

export const SEED_COUNTS = { pending: 620, approved: 3420, rejected: 240 };

const FEATURED = [
  {
    company: "Osmania University CSE",
    contact: "Mr. Rahul Sharma",
    phone: "+91 98480 12345",
    email: "rahul.sharma@osmania.edu.in",
    source: "Campus Drive",
    category: "Students / Education",
    uploadedBy: "Priya M",
    uploadedOn: "2026-11-18",
  },
  {
    company: "JNTU Hyderabad BCA",
    contact: "Ms. Pooja Reddy",
    phone: "+91 94401 56789",
    email: "pooja.reddy@jntuh.ac.in",
    source: "Web",
    category: "Students / Education",
    uploadedBy: "Priya M",
    uploadedOn: "2026-11-18",
  },
  {
    company: "CloudMatrix Technologies",
    contact: "Mr. Arun Sundar",
    phone: "+91 98450 67890",
    email: "arun.sundar@cloudmatrix.io",
    source: "Event",
    category: "IT & Upskilling",
    uploadedBy: "Arjun K",
    uploadedOn: "2026-11-18",
  },
  {
    company: "TechCorp Global Solutions",
    contact: "Mr. Vikram Malhotra",
    phone: "+91 98110 54321",
    email: "vikram.m@techcorpglobal.com",
    source: "Referral",
    category: "Corporate Training",
    uploadedBy: "Neha R",
    uploadedOn: "2026-11-17",
  },
  {
    company: "ABC Hospitals Pvt Ltd",
    contact: "Mr. Rajesh Kumar",
    phone: "+91 98765 43210",
    email: "rajesh@abchospitals.com",
    source: "Web",
    category: "Healthcare & Pharma",
    uploadedBy: "Priya M",
    uploadedOn: "2026-11-17",
  },
  {
    company: "V Care Diagnostics",
    contact: "Ms. Neha Reddy",
    phone: "+91 91234 56789",
    email: "neha@vcarelabs.in",
    source: "Event",
    category: "Healthcare & Pharma",
    uploadedBy: "Arjun K",
    uploadedOn: "2026-11-16",
  },
  {
    company: "CareerLaunch Academy",
    contact: "Mr. Manoj Pillai",
    phone: "+91 98400 33445",
    email: "manoj@careerlaunch.org",
    source: "Cold Call",
    category: "General Enquiries",
    uploadedBy: "Neha R",
    uploadedOn: "2026-11-16",
  },
  {
    company: "Andhra University MCA",
    contact: "Mr. Aditya Varma",
    phone: "+91 97000 88991",
    email: "aditya.varma@andhrauniv.edu",
    source: "Web",
    category: "Students / Education",
    uploadedBy: "Priya M",
    uploadedOn: "2026-11-15",
  },
];

const BRANDS = [
  "Sunrise",
  "MedLine",
  "Carewell",
  "Lotus",
  "Nova",
  "Silverline",
  "Prime",
  "GreenLeaf",
  "Unity",
  "Lifespring",
  "Aarogya",
  "Sapphire",
  "Metro",
  "Trinity",
  "Navya",
  "Sai Krishna",
  "Omega",
  "BlueCross",
  "Harmony",
  "Vasavi",
  "Srinivasa",
  "Pulse",
  "Aster",
  "Kaveri",
];
const KINDS = [
  "Hospitals Pvt Ltd",
  "Diagnostics",
  "Clinics",
  "Multispeciality Hospital",
  "Pharma Ltd",
  "Labs",
  "Medical Centre",
  "Healthcare LLP",
  "Dental Care",
  "Eye Hospital",
];
const FIRST = [
  "Rajesh",
  "Suresh",
  "Anil",
  "Lakshmi",
  "Deepa",
  "Srinivas",
  "Ramesh",
  "Kavya",
  "Harish",
  "Swathi",
  "Mahesh",
  "Pooja",
  "Venkat",
  "Divya",
  "Naveen",
  "Sravani",
  "Prakash",
  "Bhavana",
  "Ajay",
  "Sunita",
];
const LAST = [
  "Kumar",
  "Reddy",
  "Sharma",
  "Rao",
  "Naidu",
  "Iyer",
  "Gupta",
  "Varma",
  "Patel",
  "Menon",
  "Chowdary",
  "Pillai",
];
const FEMALE = new Set([
  "Lakshmi",
  "Deepa",
  "Kavya",
  "Swathi",
  "Pooja",
  "Divya",
  "Sravani",
  "Bhavana",
  "Sunita",
]);

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

export function isoDaysBefore(base, days) {
  const d = new Date(base + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function makeLead(r, id, status, uploadedOn, uploadedBy, category) {
  const brand = pick(r, BRANDS);
  const kind = pick(r, KINDS);
  const first = pick(r, FIRST);
  const last = pick(r, LAST);
  const domain =
    brand.toLowerCase().replace(/[^a-z]/g, "") + (kind.split(" ")[0] ?? "").toLowerCase();
  const n = () => Math.floor(r() * 10);
  const phone = `+91 ${7 + Math.floor(r() * 3)}${n()}${n()}${n()}${n()} ${n()}${n()}${n()}${n()}${n()}`;
  return {
    id,
    company: `${brand} ${kind}`,
    contact: `${FEMALE.has(first) ? "Ms." : "Mr."} ${first} ${last}`,
    phone,
    email: `${first.toLowerCase()}@${domain}.${r() > 0.5 ? "in" : "com"}`,
    source: pick(r, LEAD_SOURCES),
    category: category ?? LEAD_CATEGORIES[id % LEAD_CATEGORIES.length],
    uploadedBy: uploadedBy ?? pick(r, RESEARCHERS.slice(0, 3)),
    uploadedOn,
    status,
    rejectionReason: status === "rejected" ? pick(r, REJECTION_REASONS.slice(0, 5)) : undefined,
    designation: pick(r, DESIGNATIONS),
    location: pick(r, LOCATIONS),
    industry: pick(r, INDUSTRIES),
    reviewedOn: status === "pending" ? undefined : isoDaysBefore(uploadedOn, -1),
  };
}

export const TODAY = "2026-11-18";

const initials = (name) =>
  name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
export const batchIdFor = (researcher, iso, seq = 1) =>
  `BT-${iso.replace(/-/g, "").slice(2)}-${initials(researcher)}${seq > 1 ? `-${seq}` : ""}`;

export function buildSeedLeads() {
  const r = mulberry32(20261118);
  const leads = [];
  let id = 1;
  FEATURED.forEach((f) =>
    leads.push({
      ...f,
      id: id++,
      status: "pending",
      designation: "Managing Director",
      location: "Hyderabad",
      industry: "Healthcare",
    }),
  );
  for (let i = FEATURED.length; i < SEED_COUNTS.pending; i++) {
    leads.push(makeLead(r, id++, "pending", isoDaysBefore(TODAY, 1 + Math.floor(i / 60))));
  }
  for (let i = 0; i < SEED_COUNTS.approved; i++) {
    leads.push(makeLead(r, id++, "approved", isoDaysBefore(TODAY, 2 + Math.floor(i / 60))));
  }
  for (let i = 0; i < SEED_COUNTS.rejected; i++) {
    leads.push(makeLead(r, id++, "rejected", isoDaysBefore(TODAY, 2 + Math.floor(i / 6))));
  }
  for (const l of leads) l.batchId = batchIdFor(l.uploadedBy, l.uploadedOn);
  return leads;
}

export function buildSeedBatches(leads) {
  const map = new Map();
  for (const l of leads) {
    if (!l.batchId) continue;
    let b = map.get(l.batchId);
    if (!b) {
      const [, m, d] = l.uploadedOn.split("-");
      b = {
        id: l.batchId,
        fileName: `${(l.industry ?? "leads").toLowerCase()}_${(l.location ?? "india").toLowerCase()}_${d}${m}.xlsx`,
        uploadedOn: l.uploadedOn,
        researcher: l.uploadedBy,
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        duplicates: 0,
      };
      map.set(l.batchId, b);
    }
    b.validRecords++;
  }
  const out = [...map.values()];
  out.forEach((b, i) => {
    b.duplicates = (i * 7) % 5;
    b.invalidRecords = (i * 3) % 4;
    b.totalRecords = b.validRecords + b.duplicates + b.invalidRecords;
  });
  out.push({
    id: batchIdFor(CURRENT_RA, TODAY, 9),
    fileName: "pharma_distributors_pune_draft.xlsx",
    uploadedOn: TODAY,
    researcher: CURRENT_RA,
    totalRecords: 42,
    validRecords: 37,
    invalidRecords: 3,
    duplicates: 2,
    draft: true,
  });
  return out.sort((a, b) =>
    a.uploadedOn < b.uploadedOn ? 1 : a.uploadedOn > b.uploadedOn ? -1 : 0,
  );
}

export const SEED_BDES = [
  { name: "Ravi Kumar", allocated: 500, used: 420, connected: 152, interested: 98 },
  { name: "Anitha Reddy", allocated: 400, used: 280, connected: 102, interested: 66 },
  { name: "Kiran Varma", allocated: 300, used: 210, connected: 68, interested: 45 },
  { name: "Megha S", allocated: 300, used: 200, connected: 60, interested: 40 },
];

export const SEED_CREDITS = { allocated: 2000, used: 1320 };

export const SEED_TEAM = [
  {
    name: "Priya M",
    email: "priya.m@leadgen.pro",
    phone: "+91 90000 11111",
    role: "Research Analyst",
    department: "Market Research",
    status: "Active",
  },
  {
    name: "Arjun K",
    email: "arjun.k@leadgen.pro",
    phone: "+91 90000 22222",
    role: "Research Analyst",
    department: "Lead Generation",
    status: "Active",
  },
  {
    name: "Neha R",
    email: "neha.r@leadgen.pro",
    phone: "+91 90000 33333",
    role: "Research Analyst",
    department: "Market Research",
    status: "Active",
  },
  {
    name: "Ravi Kumar",
    email: "ravi.kumar@leadgen.pro",
    phone: "+91 90000 44444",
    role: "BDE",
    department: "Business Development",
    status: "Active",
  },
  {
    name: "Anitha Reddy",
    email: "anitha.reddy@leadgen.pro",
    phone: "+91 90000 55555",
    role: "BDE",
    department: "Sales & Outreach",
    status: "Active",
  },
  {
    name: "Kiran Varma",
    email: "kiran.varma@leadgen.pro",
    phone: "+91 90000 66666",
    role: "BDE",
    department: "Business Development",
    status: "Active",
  },
  {
    name: "Megha S",
    email: "megha.s@arahinfotech.com",
    phone: "+91 90000 77777",
    role: "BDE",
    department: "Client Acquisition",
    status: "Active",
  },
];
