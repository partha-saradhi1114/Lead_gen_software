import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Lead } from "../models/Lead.js";
import { Batch } from "../models/Batch.js";
import { CreditTransaction } from "../models/CreditTransaction.js";

const DEFAULT_PASSWORD = "Password@123";

const SEED_USERS = [
  {
    name: "Sriram",
    email: "sriram@leadgen.pro",
    role: "admin",
    credits: 0,
    creditsUsed: 0,
  },
  {
    name: "Priya M",
    email: "priya.m@leadgen.pro",
    role: "ra",
    credits: 0,
    creditsUsed: 0,
  },
  {
    name: "Arjun K",
    email: "arjun.k@leadgen.pro",
    role: "ra",
    credits: 0,
    creditsUsed: 0,
  },
  {
    name: "Neha R",
    email: "neha.r@leadgen.pro",
    role: "ra",
    credits: 0,
    creditsUsed: 0,
  },
  {
    name: "Ravi Kumar",
    email: "ravi.kumar@leadgen.pro",
    role: "bde",
    category: "Students / Education",
    credits: 500,
    creditsUsed: 320,
  },
  {
    name: "Anitha Reddy",
    email: "anitha.reddy@leadgen.pro",
    role: "bde",
    category: "IT & Upskilling",
    credits: 400,
    creditsUsed: 260,
  },
  {
    name: "Kiran Varma",
    email: "kiran.varma@leadgen.pro",
    role: "bde",
    category: "Corporate Training",
    credits: 300,
    creditsUsed: 210,
  },
  {
    name: "Megha S",
    email: "megha.s@leadgen.pro",
    role: "bde",
    category: "Healthcare & Pharma",
    credits: 300,
    creditsUsed: 200,
  },
];

const SEED_LEADS = [
  // --- Category: Students / Education (Training Institute / Admissions Leads) ---
  {
    company: "Osmania University CSE",
    contact: "Rahul Sharma",
    designation: "Final Year Student",
    phone: "+91 98480 12345",
    email: "rahul.sharma@osmania.edu.in",
    location: "Hyderabad",
    industry: "Higher Education",
    category: "Students / Education",
    source: "Campus Drive",
    status: "approved",
    stage: "interested",
    notes: "Attended Python workshop. Requested evening batch admission details and fees.",
    followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  },
  {
    company: "JNTU Hyderabad BCA",
    contact: "Pooja Reddy",
    designation: "2025 Graduate",
    phone: "+91 94401 56789",
    email: "pooja.reddy@jntuh.ac.in",
    location: "Hyderabad",
    industry: "Education",
    category: "Students / Education",
    source: "Excel Upload",
    status: "approved",
    stage: "connected",
    notes: "Spoke regarding Data Science & AI Bootcamp. Requested syllabus PDF on WhatsApp.",
    followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    company: "Andhra University MCA",
    contact: "Aditya Varma",
    designation: "MCA Aspirant",
    phone: "+91 97000 88991",
    email: "aditya.varma@andhrauniv.edu",
    location: "Visakhapatnam",
    industry: "Education",
    category: "Students / Education",
    source: "Web Inquiry",
    status: "pending",
    stage: "new",
    notes: "Inquired about Full Stack Java course placement guarantee.",
  },
  {
    company: "CBIT Engineering College",
    contact: "Sneha Patel",
    designation: "ECE 3rd Year Student",
    phone: "+91 98855 43210",
    email: "sneha.patel@cbit.ac.in",
    location: "Hyderabad",
    industry: "Engineering",
    category: "Students / Education",
    source: "Referral",
    status: "approved",
    stage: "converted",
    notes: "Fee paid for MERN Stack weekend classroom batch. Enrollment ID #ADM-2026-081.",
  },
  {
    company: "GITAM University",
    contact: "Kiran Teja",
    designation: "B.Tech Mechanical",
    phone: "+91 99890 22334",
    email: "kiran.teja@gitam.edu",
    location: "Visakhapatnam",
    industry: "Education",
    category: "Students / Education",
    source: "Excel Upload",
    status: "approved",
    stage: "follow-up",
    notes: "Looking to switch from Mechanical to Cloud DevOps. Wants demo session link.",
    followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    company: "St. Francis College",
    contact: "Divya Nair",
    designation: "B.Sc Graduate",
    phone: "+91 91234 00000",
    email: "divya.nair@dummymail.com",
    location: "Hyderabad",
    industry: "Education",
    category: "Students / Education",
    source: "Excel Upload",
    status: "rejected",
    rejectionReason: "Invalid phone number format",
    stage: "new",
  },

  // --- Category: IT & Upskilling ---
  {
    company: "CloudMatrix Technologies",
    contact: "Arun Sundar",
    designation: "Senior DevOps Engineer",
    phone: "+91 98450 67890",
    email: "arun.sundar@cloudmatrix.io",
    location: "Bengaluru",
    industry: "Cloud & DevOps",
    category: "IT & Upskilling",
    source: "Web",
    status: "approved",
    stage: "connected",
    notes: "Interested in corporate Kubernetes and Terraform deep-dive workshop.",
  },
  {
    company: "NextGen Coders Hub",
    contact: "Harish Balaji",
    designation: "Tech Lead",
    phone: "+91 99001 23456",
    email: "harish@nextgencoders.dev",
    location: "Bengaluru",
    industry: "Software Services",
    category: "IT & Upskilling",
    source: "Excel Upload",
    status: "approved",
    stage: "interested",
    notes: "Looking to upskill 8 mid-level devs in Golang and Microservices.",
    followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    company: "CodeCraft Solutions",
    contact: "Swetha Nair",
    designation: "QA Automation Engineer",
    phone: "+91 97412 88990",
    email: "swetha@codecraft.co",
    location: "Chennai",
    industry: "Software Testing",
    category: "IT & Upskilling",
    source: "LinkedIn",
    status: "pending",
    stage: "new",
  },
  {
    company: "Quantum Byte Systems",
    contact: "Sanjay Joshi",
    designation: "Principal Architect",
    phone: "+91 98230 45678",
    email: "sanjay@quantumbyte.net",
    location: "Pune",
    industry: "IT Services",
    category: "IT & Upskilling",
    source: "Excel Upload",
    status: "rejected",
    rejectionReason: "Duplicate lead already in system",
    stage: "new",
  },

  // --- Category: Corporate Training ---
  {
    company: "TechCorp Global Solutions",
    contact: "Vikram Malhotra",
    designation: "VP of Human Resources",
    phone: "+91 98110 54321",
    email: "vikram.m@techcorpglobal.com",
    location: "Gurugram",
    industry: "IT Consulting",
    category: "Corporate Training",
    source: "Partner Referral",
    status: "approved",
    stage: "interested",
    notes: "Discussing 45-day induction training for 60 fresh college hires.",
    followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  },
  {
    company: "Horizon IT Services",
    contact: "Meenakshi Rao",
    designation: "L&D Director",
    phone: "+91 98499 87654",
    email: "meenakshi@horizonit.in",
    location: "Hyderabad",
    industry: "Enterprise IT",
    category: "Corporate Training",
    source: "Excel Upload",
    status: "approved",
    stage: "connected",
    notes: "Requested quote for AWS Certified Solutions Architect team training.",
  },
  {
    company: "Synergy Infotech",
    contact: "Pradeep Menon",
    designation: "Head of Talent Development",
    phone: "+91 98950 11223",
    email: "pradeep.menon@synergyinfo.com",
    location: "Kochi",
    industry: "Corporate Services",
    category: "Corporate Training",
    source: "Event",
    status: "pending",
    stage: "new",
  },

  // --- Category: Healthcare & Pharma ---
  {
    company: "ABC Hospitals Pvt Ltd",
    contact: "Mr. Rajesh Kumar",
    designation: "Managing Director",
    phone: "+91 98765 43210",
    email: "rajesh@abchospitals.com",
    location: "Hyderabad",
    industry: "Healthcare",
    category: "Healthcare & Pharma",
    source: "Excel Upload",
    status: "approved",
    stage: "connected",
    notes: "Follow-up scheduled for demo next Tuesday.",
    followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    company: "V Care Diagnostics",
    contact: "Ms. Neha Reddy",
    designation: "Operations Head",
    phone: "+91 91234 56789",
    email: "neha@vcarelabs.in",
    location: "Bengaluru",
    industry: "Diagnostics",
    category: "Healthcare & Pharma",
    source: "Excel Upload",
    status: "approved",
    stage: "interested",
    notes: "Requested enterprise pricing sheet for 5 diagnostic branches.",
    followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  },
  {
    company: "HealthFirst Clinics",
    contact: "Mr. Vivek Sharma",
    designation: "CEO",
    phone: "+91 99887 66554",
    email: "vivek@healthfirst.in",
    location: "Hyderabad",
    industry: "Healthcare",
    category: "Healthcare & Pharma",
    source: "Excel Upload",
    status: "pending",
    stage: "new",
  },
  {
    company: "Wellness Plus Pvt Ltd",
    contact: "Mr. Karthik Rao",
    designation: "Purchase Manager",
    phone: "+91 87965 12034",
    email: "karthik@wellnessplus.in",
    location: "Chennai",
    industry: "Wellness",
    category: "Healthcare & Pharma",
    source: "Excel Upload",
    status: "rejected",
    rejectionReason: "Invalid phone number format",
    stage: "new",
  },
  {
    company: "Apollo Spectra Care",
    contact: "Dr. Ananya Sen",
    designation: "Chief Medical Officer",
    phone: "+91 94455 66778",
    email: "ananya.sen@apollospectra.in",
    location: "Visakhapatnam",
    industry: "Healthcare",
    category: "Healthcare & Pharma",
    source: "Excel Upload",
    status: "approved",
    stage: "follow-up",
    notes: "Sent proposal via email. Awaiting review.",
  },
  {
    company: "Zenith Pharma Research",
    contact: "Ms. Shalini Iyer",
    designation: "Procurement Lead",
    phone: "+91 98877 66550",
    email: "shalini@zenithpharma.org",
    location: "Mumbai",
    industry: "Pharmaceuticals",
    category: "Healthcare & Pharma",
    source: "Excel Upload",
    status: "approved",
    stage: "out-of-coverage",
    notes: "Only looking for pan-India supplies, out of coverage for regional phase.",
  },

  // --- Category: General Enquiries ---
  {
    company: "CareerLaunch Academy",
    contact: "Manoj Pillai",
    designation: "Branch Counselor",
    phone: "+91 98400 33445",
    email: "manoj@careerlaunch.org",
    location: "Chennai",
    industry: "Counseling",
    category: "General Enquiries",
    source: "Web",
    status: "approved",
    stage: "connected",
    notes: "Inquired about institutional partnership and referral commission structure.",
  },
  {
    company: "SkillUp Foundation Trust",
    contact: "Sunita Rao",
    designation: "Program Coordinator",
    phone: "+91 99490 55667",
    email: "sunita@skillupfoundation.org",
    location: "Hyderabad",
    industry: "Social Impact",
    category: "General Enquiries",
    source: "Web Inquiry",
    status: "pending",
    stage: "new",
  },
];

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await connectDB();

    console.log("Cleaning existing database collections...");
    await User.deleteMany({});
    await Lead.deleteMany({});
    await Batch.deleteMany({});
    await CreditTransaction.deleteMany({});

    console.log("Seeding Users with encrypted passwords and vertical categories...");
    const createdUsers = [];
    for (const u of SEED_USERS) {
      const user = await User.create({
        ...u,
        password: DEFAULT_PASSWORD, // Will be hashed by pre-save hook
      });
      createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} users successfully.`);

    const adminUser = createdUsers.find((u) => u.role === "admin");
    const raPriya = createdUsers.find((u) => u.email === "priya.m@leadgen.pro");
    const raArjun = createdUsers.find((u) => u.email === "arjun.k@leadgen.pro");
    const raNeha = createdUsers.find((u) => u.email === "neha.r@leadgen.pro");

    const bdeRavi = createdUsers.find((u) => u.email === "ravi.kumar@leadgen.pro");
    const bdeAnitha = createdUsers.find((u) => u.email === "anitha.reddy@leadgen.pro");
    const bdeKiran = createdUsers.find((u) => u.email === "kiran.varma@leadgen.pro");
    const bdeMegha = createdUsers.find((u) => u.email === "megha.s@leadgen.pro");

    console.log("Seeding Batch records across categories...");
    const batch1 = await Batch.create({
      batchId: "BATCH-2026-001",
      fileName: "Student_Campus_Admissions_Drive.xlsx",
      uploadedBy: raPriya._id,
      uploaderName: raPriya.name,
      category: "Students / Education",
      uploadedOn: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      totalRows: 60,
      approvedCount: 48,
      rejectedCount: 4,
      pendingCount: 8,
      status: "mixed",
    });

    const batch2 = await Batch.create({
      batchId: "BATCH-2026-002",
      fileName: "IT_Upskilling_Professionals_Q1.xlsx",
      uploadedBy: raArjun._id,
      uploaderName: raArjun.name,
      category: "IT & Upskilling",
      uploadedOn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      totalRows: 40,
      approvedCount: 32,
      rejectedCount: 3,
      pendingCount: 5,
      status: "mixed",
    });

    const batch3 = await Batch.create({
      batchId: "BATCH-2026-003",
      fileName: "Corporate_Training_HR_Leads.xlsx",
      uploadedBy: raNeha._id,
      uploaderName: raNeha.name,
      category: "Corporate Training",
      uploadedOn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      totalRows: 35,
      approvedCount: 28,
      rejectedCount: 2,
      pendingCount: 5,
      status: "mixed",
    });

    const batch4 = await Batch.create({
      batchId: "BATCH-2026-004",
      fileName: "Healthcare_Diagnostics_Database.xlsx",
      uploadedBy: raPriya._id,
      uploaderName: raPriya.name,
      category: "Healthcare & Pharma",
      uploadedOn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      totalRows: 30,
      approvedCount: 22,
      rejectedCount: 3,
      pendingCount: 5,
      status: "mixed",
    });

    console.log("Seeding Leads with categorized assignments...");
    for (let i = 0; i < SEED_LEADS.length; i++) {
      const l = SEED_LEADS[i];
      const isApproved = l.status === "approved";

      // Pick appropriate BDE based on category vertical
      let targetBde = bdeRavi;
      if (l.category === "IT & Upskilling") targetBde = bdeAnitha;
      else if (l.category === "Corporate Training") targetBde = bdeKiran;
      else if (l.category === "Healthcare & Pharma") targetBde = bdeMegha;

      // Pick appropriate RA and Batch
      let targetRa = raPriya;
      let targetBatch = batch1;
      if (l.category === "IT & Upskilling") {
        targetRa = raArjun;
        targetBatch = batch2;
      } else if (l.category === "Corporate Training") {
        targetRa = raNeha;
        targetBatch = batch3;
      } else if (l.category === "Healthcare & Pharma") {
        targetRa = raPriya;
        targetBatch = batch4;
      }

      await Lead.create({
        ...l,
        batchId: targetBatch.batchId,
        uploadedBy: targetRa._id,
        uploaderName: targetRa.name,
        uploadedOn: new Date(Date.now() - (i + 1) * 8 * 60 * 60 * 1000),
        reviewedBy: isApproved || l.status === "rejected" ? adminUser._id : null,
        reviewedOn: isApproved || l.status === "rejected" ? new Date() : null,
        assignedTo: isApproved ? targetBde._id : null,
        assignedName: isApproved ? targetBde.name : null,
        assignedOn: isApproved ? new Date() : null,
        unlockedBy: isApproved ? [targetBde._id] : [],
      });
    }
    console.log(`Created ${SEED_LEADS.length} categorized sample leads.`);

    console.log("Seeding Credit Transactions...");
    await CreditTransaction.create({
      bdeId: bdeRavi._id,
      bdeName: bdeRavi.name,
      amount: 500,
      type: "allocation",
      balanceAfter: 500,
      description: "Monthly credit quota allocated by Master Admin",
    });

    await CreditTransaction.create({
      bdeId: bdeRavi._id,
      bdeName: bdeRavi.name,
      amount: -10,
      type: "unlock",
      balanceAfter: 490,
      leadCompany: "Osmania University CSE",
      description: "Unlocked student lead contact details",
    });

    console.log("\n==========================================");
    console.log("DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("==========================================");
    console.log("Categorized sample leads created across:");
    console.log("• Students / Education (Assigned to Ravi Kumar)");
    console.log("• IT & Upskilling (Assigned to Anitha Reddy)");
    console.log("• Corporate Training (Assigned to Kiran Varma)");
    console.log("• Healthcare & Pharma (Assigned to Megha S)");
    console.log("• General Enquiries");
    console.log("==========================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seedDatabase();
