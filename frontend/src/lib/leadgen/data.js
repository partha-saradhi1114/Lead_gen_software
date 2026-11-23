export const LEAD_SOURCES = [
  "Web",
  "Event",
  "Referral",
  "LinkedIn",
  "Cold Call",
];
export const LEAD_CATEGORIES = [
  "Students / Education",
  "IT & Upskilling",
  "Corporate Training",
  "Healthcare & Pharma",
  "General Enquiries",
];
export const BDE_CATEGORIES = {
  "Ravi Kumar": "Students / Education",
  "Anitha Reddy": "IT & Upskilling",
  "Kiran Varma": "Corporate Training",
  "Megha S": "Healthcare & Pharma",
};
export const RESEARCHER_CATEGORIES = {
  "Priya M": ["Healthcare & Pharma", "Students / Education"],
  "Arjun K": ["IT & Upskilling", "Healthcare & Pharma"],
  "Neha R": ["Corporate Training", "IT & Upskilling"],
  "Sneha T": ["Healthcare & Pharma", "General Enquiries"],
  "Rahul P": ["Students / Education", "General Enquiries"],
};
export function getResearcherCategories(researcher = CURRENT_RA) {
  return RESEARCHER_CATEGORIES[researcher] ?? LEAD_CATEGORIES;
}
export const RESEARCHERS = [
  "Priya M",
  "Arjun K",
  "Neha R",
  "Sneha T",
  "Rahul P",
];
export const REJECTION_REASONS = [
  "Duplicate lead",
  "Invalid phone number",
  "Invalid email address",
  "Outside target segment",
  "Incomplete information",
  "Other",
];

/** Sample-data identity used for the Research Analyst view until real sign-in exists. */
export const CURRENT_RA = "Priya M";
/** Sample figures the Research Analyst dashboard must show for CURRENT_RA (duplicates tracked separately). */
export const RA_SEED_TARGETS = {
  pending: 196,
  approved: 1120,
  rejected: 77,
  duplicates: 126,
};
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
    company: "ABC Hospitals Pvt Ltd",
    contact: "Mr. Rajesh Kumar",
    phone: "+91 98765 43210",
    email: "rajesh@abchospitals.com",
    source: "Web",
    category: "Healthcare & Pharma",
    uploadedBy: "Priya M",
    uploadedOn: "2026-11-18",
  },
  {
    company: "V Care Diagnostics",
    contact: "Ms. Neha Reddy",
    phone: "+91 91234 56789",
    email: "neha@vcarelabs.in",
    source: "Event",
    category: "Healthcare & Pharma",
    uploadedBy: "Arjun K",
    uploadedOn: "2026-11-18",
  },
  {
    company: "HealthFirst Clinics",
    contact: "Mr. Vivek Sharma",
    phone: "+91 99887 66554",
    email: "vivek@healthfirst.in",
    source: "Referral",
    category: "Students / Education",
    uploadedBy: "Priya M",
    uploadedOn: "2026-11-17",
  },
  {
    company: "Wellness Plus Pvt Ltd",
    contact: "Mr. Karthik Rao",
    phone: "+91 87965 12034",
    email: "karthik@wellnessplus.in",
    source: "Web",
    category: "Corporate Training",
    uploadedBy: "Neha R",
    uploadedOn: "2026-11-17",
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

// Deterministic PRNG so server and browser render identical sample data.
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
    brand.toLowerCase().replace(/[^a-z]/g, "") +
    (kind.split(" ")[0] ?? "").toLowerCase();
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
    rejectionReason:
      status === "rejected"
        ? pick(r, REJECTION_REASONS.slice(0, 5))
        : undefined,
    designation: pick(r, DESIGNATIONS),
    location: pick(r, LOCATIONS),
    industry: pick(r, INDUSTRIES),
    country: "India",
    stateCity: pick(r, LOCATIONS),
    website: `https://www.${domain}.com`,
    companyAddress: `Plot ${id * 3}, Tech Park, ${pick(r, LOCATIONS)}`,
    linkedin: `https://linkedin.com/company/${domain}`,
    description: `Leading organization in ${category ?? "Healthcare"} vertical.`,
    reviewedOn:
      status === "pending" ? undefined : isoDaysBefore(uploadedOn, -1),
  };
}

export const TODAY = "2026-11-18";

export function buildSeedLeads() {
  const r = mulberry32(20261118);
  const leads = [];
  let id = 1;
  FEATURED.forEach((f) =>
    leads.push({
      ...f,
      featured: true,
      id: id++,
      status: "pending",
      designation: "Managing Director",
      location: "Hyderabad",
      industry: "Healthcare",
    }),
  );
  for (let i = FEATURED.length; i < SEED_COUNTS.pending; i++) {
    leads.push(
      makeLead(
        r,
        id++,
        "pending",
        isoDaysBefore(TODAY, 1 + Math.floor(i / 60)),
      ),
    );
  }
  for (let i = 0; i < SEED_COUNTS.approved; i++) {
    leads.push(
      makeLead(
        r,
        id++,
        "approved",
        isoDaysBefore(TODAY, 2 + Math.floor(i / 60)),
      ),
    );
  }
  for (let i = 0; i < SEED_COUNTS.rejected; i++) {
    leads.push(
      makeLead(
        r,
        id++,
        "rejected",
        isoDaysBefore(TODAY, 2 + Math.floor(i / 6)),
      ),
    );
  }
  // Give CURRENT_RA exactly the target number of leads per status; others go to the rest of the team.
  const others = RESEARCHERS.slice(1, 3);
  const quota = { ...RA_SEED_TARGETS };
  for (const l of leads)
    if (l.uploadedBy === CURRENT_RA && l.featured) quota[l.status]--;
  for (const l of leads) {
    if (l.featured) continue;
    if (quota[l.status] > 0) {
      l.uploadedBy = CURRENT_RA;
      quota[l.status]--;
    } else if (l.uploadedBy === CURRENT_RA)
      l.uploadedBy = others[l.id % others.length];
  }
  for (const l of leads) delete l.featured;
  for (const l of leads) l.batchId = batchIdFor(l.uploadedBy, l.uploadedOn);
  return leads;
}

const initials = (name) =>
  name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
export const batchIdFor = (researcher, iso, seq = 1) =>
  `BT-${iso.replace(/-/g, "").slice(2)}-${initials(researcher)}${seq > 1 ? `-${seq}` : ""}`;

/** Upload batches derived from the seeded leads (one batch per researcher per day), plus one draft. */
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
  });
  // Spread exactly RA_SEED_TARGETS.duplicates across CURRENT_RA's submitted batches.
  const mine = out.filter((b) => b.researcher === CURRENT_RA);
  mine.forEach((b, i) => {
    const base = Math.floor(RA_SEED_TARGETS.duplicates / mine.length);
    b.duplicates =
      base + (i < RA_SEED_TARGETS.duplicates % mine.length ? 1 : 0);
  });
  out.forEach((b) => {
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
  {
    name: "Ravi Kumar",
    allocated: 500,
    used: 420,
    connected: 152,
    interested: 98,
  },
  {
    name: "Anitha Reddy",
    allocated: 400,
    used: 280,
    connected: 102,
    interested: 66,
  },
  {
    name: "Kiran Varma",
    allocated: 300,
    used: 210,
    connected: 68,
    interested: 45,
  },
  { name: "Megha S", allocated: 300, used: 200, connected: 60, interested: 40 },
];

/** Credits allocated to BDEs not shown in the performance table (pool reserve). */
export const SEED_CREDITS = { allocated: 2000, used: 1320 };

export const RA_PERFORMANCE = [
  { name: "Priya M", uploaded: 1250, approved: 1020, rejected: 60 },
  { name: "Arjun K", uploaded: 980, approved: 760, rejected: 50 },
  { name: "Neha R", uploaded: 860, approved: 690, rejected: 40 },
];

export const RA_EXTENDED = [
  ...RA_PERFORMANCE,
  { name: "Sneha T", uploaded: 720, approved: 560, rejected: 52 },
  { name: "Rahul P", uploaded: 470, approved: 390, rejected: 38 },
];

export const FUNNEL_STATIC = { viewed: 1320, connected: 920, interested: 310 };

export const STATUS_DISTRIBUTION = [
  {
    key: "connected",
    label: "Connected",
    percent: 35,
    count: 462,
    color: "var(--chart-1)",
  },
  {
    key: "ooc",
    label: "Out of Coverage",
    percent: 12,
    count: 158,
    color: "var(--chart-2)",
  },
  {
    key: "interested",
    label: "Interested",
    percent: 23,
    count: 304,
    color: "var(--chart-3)",
  },
  {
    key: "notInterested",
    label: "Not Interested",
    percent: 18,
    count: 238,
    color: "var(--chart-4)",
  },
  {
    key: "followUp",
    label: "Follow-up",
    percent: 12,
    count: 158,
    color: "var(--chart-5)",
  },
];

export const FOLLOW_UPS = {
  overdue: 48,
  today: 36,
  soon: 69,
};

export const FOLLOW_UP_ITEMS = [
  {
    company: "Lotus Diagnostics",
    contact: "Ms. Kavya Iyer",
    bde: "Ravi Kumar",
    due: "2026-11-15",
    bucket: "overdue",
  },
  {
    company: "Metro Eye Hospital",
    contact: "Mr. Harish Rao",
    bde: "Anitha Reddy",
    due: "2026-11-16",
    bucket: "overdue",
  },
  {
    company: "Aster Clinics",
    contact: "Mr. Naveen Gupta",
    bde: "Kiran Varma",
    due: "2026-11-17",
    bucket: "overdue",
  },
  {
    company: "Sunrise Hospitals Pvt Ltd",
    contact: "Ms. Deepa Menon",
    bde: "Ravi Kumar",
    due: "2026-11-18",
    bucket: "today",
  },
  {
    company: "Pulse Labs",
    contact: "Mr. Ajay Patel",
    bde: "Megha S",
    due: "2026-11-18",
    bucket: "today",
  },
  {
    company: "Harmony Dental Care",
    contact: "Ms. Pooja Naidu",
    bde: "Anitha Reddy",
    due: "2026-11-19",
    bucket: "soon",
  },
  {
    company: "Nova Medical Centre",
    contact: "Mr. Srinivas Varma",
    bde: "Kiran Varma",
    due: "2026-11-20",
    bucket: "soon",
  },
  {
    company: "Kaveri Healthcare LLP",
    contact: "Ms. Swathi Reddy",
    bde: "Megha S",
    due: "2026-11-21",
    bucket: "soon",
  },
];

export const SEED_TEAM = [
  {
    name: "Priya M",
    email: "priya.m@leadgen.pro",
    phone: "+91 90000 11111",
    role: "Research Analyst",
    category: "Health/Insurance",
    department: "Health/Insurance",
    status: "Active",
  },
  {
    name: "Arjun K",
    email: "arjun.k@leadgen.pro",
    phone: "+91 90000 22222",
    role: "Research Analyst",
    category: "Corporate firm",
    department: "Corporate firm",
    status: "Active",
  },
  {
    name: "Neha R",
    email: "neha.r@leadgen.pro",
    phone: "+91 90000 33333",
    role: "Research Analyst",
    category: "Student/Corporate training",
    department: "Student/Corporate training",
    status: "Active",
  },
  {
    name: "Ravi Kumar",
    email: "ravi.kumar@leadgen.pro",
    phone: "+91 90000 44444",
    role: "BDE",
    category: "Student/Corporate training",
    department: "Student/Corporate training",
    status: "Active",
  },
  {
    name: "Anitha Reddy",
    email: "anitha.reddy@leadgen.pro",
    phone: "+91 90000 55555",
    role: "BDE",
    category: "Health/Insurance",
    department: "Health/Insurance",
    status: "Active",
  },
  {
    name: "Kiran Varma",
    email: "kiran.varma@leadgen.pro",
    phone: "+91 90000 66666",
    role: "BDE",
    category: "Corporate firm",
    department: "Corporate firm",
    status: "Active",
  },
  {
    name: "Megha S",
    email: "megha.s@leadgen.pro",
    phone: "+91 90000 77777",
    role: "BDE",
    category: "Student/Corporate training",
    department: "Student/Corporate training",
    status: "Active",
  },
];

export const NOTIFICATIONS = [
  // 1. MASTER ADMIN NOTIFICATIONS (High-level supervisory oversight across all RAs and BDEs)
  {
    id: 1,
    role: "admin",
    title: "48 leads uploaded by Priya M awaiting review",
    time: "10 min ago",
    tone: "blue",
  },
  {
    id: 2,
    role: "admin",
    title: "Ravi Kumar used 84% of allocated credits",
    time: "1 hr ago",
    tone: "amber",
  },
  {
    id: 3,
    role: "admin",
    title: "12 follow-ups became overdue across BDE team",
    time: "3 hrs ago",
    tone: "red",
  },
  {
    id: 4,
    role: "admin",
    title: "Anitha Reddy marked 6 leads Interested",
    time: "Yesterday",
    tone: "green",
  },
  {
    id: 5,
    role: "admin",
    title: "Kiran Varma submitted a credit top-up request (200 credits)",
    time: "Yesterday",
    tone: "blue",
  },

  // 2. RESEARCH ANALYST (RA) NOTIFICATIONS (Personal batch approvals, rejections, QA feedback, sector quotas)
  {
    id: 101,
    role: "ra",
    targetUser: "Priya M",
    title: "Batch Reviewed: 42 leads approved from your latest upload",
    time: "15 min ago",
    tone: "green",
  },
  {
    id: 102,
    role: "ra",
    targetUser: "Priya M",
    title: "6 leads rejected from Batch #202611-09 (Invalid contact phone)",
    time: "45 min ago",
    tone: "red",
  },
  {
    id: 103,
    role: "ra",
    targetUser: "Priya M",
    title: "Priority assignment: Source Healthcare & Clinic leads for Telangana",
    time: "2 hrs ago",
    tone: "blue",
  },
  {
    id: 104,
    role: "ra",
    targetUser: "Priya M",
    title: "Quality milestone: Your lead approval rate reached 81.6%",
    time: "Yesterday",
    tone: "blue",
  },
  {
    id: 105,
    role: "ra",
    targetUser: "Arjun K",
    title: "Batch Reviewed: 38 leads approved by Admin",
    time: "30 min ago",
    tone: "green",
  },
  {
    id: 106,
    role: "ra",
    targetUser: "Arjun K",
    title: "5 leads flagged for duplicate verification in Diagnostics",
    time: "2 hrs ago",
    tone: "amber",
  },
  {
    id: 107,
    role: "ra",
    targetUser: "Arjun K",
    title: "Upload confirmed: 50 leads received for verification",
    time: "Yesterday",
    tone: "blue",
  },

  // 3. BUSINESS DEVELOPMENT EXECUTIVE (BDE) NOTIFICATIONS (Personal allocated leads, follow-ups, personal credit quota)
  {
    id: 201,
    role: "bde",
    targetUser: "Ravi Kumar",
    title: "25 freshly approved leads allocated to your active pipeline",
    time: "20 min ago",
    tone: "blue",
  },
  {
    id: 202,
    role: "bde",
    targetUser: "Ravi Kumar",
    title: "3 follow-up calls are overdue today (Carewell, Lotus Clinics)",
    time: "1 hr ago",
    tone: "red",
  },
  {
    id: 203,
    role: "bde",
    targetUser: "Ravi Kumar",
    title: "Credit Alert: 84% credits used (80 credits remaining)",
    time: "2 hrs ago",
    tone: "amber",
  },
  {
    id: 204,
    role: "bde",
    targetUser: "Ravi Kumar",
    title: "Prospect converted: Vasavi Multi-Speciality Hospital",
    time: "Yesterday",
    tone: "green",
  },
  {
    id: 205,
    role: "bde",
    targetUser: "Anitha Reddy",
    title: "20 verified leads allocated to your pipeline",
    time: "25 min ago",
    tone: "blue",
  },
  {
    id: 206,
    role: "bde",
    targetUser: "Anitha Reddy",
    title: "Credit Top-Up: Admin approved 100 bonus credits for your account",
    time: "1 hr ago",
    tone: "green",
  },
  {
    id: 207,
    role: "bde",
    targetUser: "Anitha Reddy",
    title: "2 client follow-ups due in the next 30 minutes",
    time: "3 hrs ago",
    tone: "amber",
  },
  {
    id: 208,
    role: "bde",
    targetUser: "Anitha Reddy",
    title: "Monthly milestone: 66 leads converted (On track)",
    time: "Yesterday",
    tone: "blue",
  },
];

/**
 * Returns notifications scoped to the logged-in role and individual persona.
 * - Master Admin sees all macro / supervisory team notifications across all users.
 * - Research Analysts see only their own batch reviews, approvals, rejections, and assignments.
 * - BDEs see only their assigned leads, upcoming/overdue follow-ups, and personal credit balance.
 */
export function getNotificationsForUser(role, userName) {
  const normalizedRole = (role || "").toLowerCase();

  if (normalizedRole === "admin" || normalizedRole.includes("admin")) {
    return NOTIFICATIONS.filter((n) => n.role === "admin");
  }

  if (
    normalizedRole === "ra" ||
    normalizedRole.includes("research") ||
    normalizedRole.includes("analyst")
  ) {
    const userMatches = NOTIFICATIONS.filter(
      (n) =>
        n.role === "ra" &&
        n.targetUser &&
        n.targetUser.toLowerCase() === (userName || "").toLowerCase(),
    );
    if (userMatches.length > 0) return userMatches;
    // Default fallback to Priya M's RA notifications or role-wide ra notifications
    return NOTIFICATIONS.filter(
      (n) => n.role === "ra" && (!n.targetUser || n.targetUser === CURRENT_RA),
    );
  }

  if (
    normalizedRole === "bde" ||
    normalizedRole.includes("business") ||
    normalizedRole.includes("executive")
  ) {
    const userMatches = NOTIFICATIONS.filter(
      (n) =>
        n.role === "bde" &&
        n.targetUser &&
        n.targetUser.toLowerCase() === (userName || "").toLowerCase(),
    );
    if (userMatches.length > 0) return userMatches;
    // Default fallback to Ravi Kumar's BDE notifications or role-wide bde notifications
    return NOTIFICATIONS.filter(
      (n) =>
        n.role === "bde" && (!n.targetUser || n.targetUser === "Ravi Kumar"),
    );
  }

  return NOTIFICATIONS.filter((n) => n.role === "admin");
}

export function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${String(d ?? 1).padStart(2, "0")}-${months[(m ?? 1) - 1] ?? ""}-${y ?? ""}`;
}

export const fmt = (n) => {
  if (n === null || n === undefined) return "0";
  const num = typeof n === "number" ? n : Number(n);
  return isNaN(num) ? "0" : num.toLocaleString("en-IN");
};
export const pct = (num, den) => {
  const n = Number(num) || 0;
  const d = Number(den) || 0;
  return d === 0 ? 0 : (n / d) * 100;
};
