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
    email: "sriram@arahinfotech.com",
    role: "admin",
    credits: 0,
    creditsUsed: 0,
  },
  {
    name: "Priya M",
    email: "priya.m@arahinfotech.com",
    role: "ra",
    credits: 0,
    creditsUsed: 0,
  },
  {
    name: "Arjun K",
    email: "arjun.k@arahinfotech.com",
    role: "ra",
    credits: 0,
    creditsUsed: 0,
  },
  {
    name: "Neha R",
    email: "neha.r@arahinfotech.com",
    role: "ra",
    credits: 0,
    creditsUsed: 0,
  },
  {
    name: "Ravi Kumar",
    email: "ravi.kumar@arahinfotech.com",
    role: "bde",
    credits: 500,
    creditsUsed: 320,
  },
  {
    name: "Anitha Reddy",
    email: "anitha.reddy@arahinfotech.com",
    role: "bde",
    credits: 400,
    creditsUsed: 260,
  },
  {
    name: "Kiran Varma",
    email: "kiran.varma@arahinfotech.com",
    role: "bde",
    credits: 300,
    creditsUsed: 210,
  },
  {
    name: "Megha S",
    email: "megha.s@arahinfotech.com",
    role: "bde",
    credits: 300,
    creditsUsed: 200,
  },
];

const SEED_LEADS = [
  {
    company: "ABC Hospitals Pvt Ltd",
    contact: "Mr. Rajesh Kumar",
    designation: "Managing Director",
    phone: "+91 98765 43210",
    email: "rajesh@abchospitals.com",
    location: "Hyderabad",
    industry: "Healthcare",
    source: "Excel Upload",
    status: "approved",
    stage: "connected",
    notes: "Spoke with procurement team. Follow-up scheduled for demo next Tuesday.",
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
    source: "Excel Upload",
    status: "approved",
    stage: "interested",
    notes: "Requested enterprise pricing sheet for 5 branches.",
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
    source: "Excel Upload",
    status: "approved",
    stage: "follow-up",
    notes: "Sent proposal via email. Awaiting review.",
    followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    company: "LifeLine Pathology Lab",
    contact: "Mr. Sunil Varma",
    designation: "Lab Director",
    phone: "+91 93322 11009",
    email: "sunil@lifelinepath.com",
    location: "Vijayawada",
    industry: "Diagnostics",
    source: "Excel Upload",
    status: "pending",
    stage: "new",
  },
  {
    company: "Metro Dental Hub",
    contact: "Dr. Sandeep Chowdary",
    designation: "Clinic Head",
    phone: "+91 97788 99001",
    email: "sandeep@metrodental.in",
    location: "Hyderabad",
    industry: "Dental",
    source: "Excel Upload",
    status: "rejected",
    rejectionReason: "Duplicate lead already exists",
    stage: "new",
  },
  {
    company: "Zenith Pharma Research",
    contact: "Ms. Shalini Iyer",
    designation: "Procurement Lead",
    phone: "+91 98877 66550",
    email: "shalini@zenithpharma.org",
    location: "Mumbai",
    industry: "Pharmaceuticals",
    source: "Excel Upload",
    status: "approved",
    stage: "out-of-coverage",
    notes: "Only looking for pan-India supplies, out of coverage for regional phase.",
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

    console.log("Seeding Users with encrypted passwords...");
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
    const raPriya = createdUsers.find((u) => u.email === "priya.m@arahinfotech.com");
    const bdeRavi = createdUsers.find((u) => u.email === "ravi.kumar@arahinfotech.com");

    console.log("Seeding Batch records...");
    const batch1 = await Batch.create({
      batchId: "BATCH-2026-001",
      fileName: "Telangana_Hospital_Leads_Nov.xlsx",
      uploadedBy: raPriya._id,
      uploaderName: raPriya.name,
      uploadedOn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      totalRows: 50,
      approvedCount: 38,
      rejectedCount: 4,
      pendingCount: 8,
      status: "mixed",
    });

    const batch2 = await Batch.create({
      batchId: "BATCH-2026-002",
      fileName: "Bengaluru_Diagnostics_Leads.xlsx",
      uploadedBy: raPriya._id,
      uploaderName: raPriya.name,
      uploadedOn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      totalRows: 30,
      approvedCount: 25,
      rejectedCount: 2,
      pendingCount: 3,
      status: "mixed",
    });

    console.log("Seeding Leads...");
    for (let i = 0; i < SEED_LEADS.length; i++) {
      const l = SEED_LEADS[i];
      const isApproved = l.status === "approved";

      await Lead.create({
        ...l,
        batchId: i % 2 === 0 ? batch1.batchId : batch2.batchId,
        uploadedBy: raPriya._id,
        uploaderName: raPriya.name,
        uploadedOn: new Date(Date.now() - (i + 1) * 12 * 60 * 60 * 1000),
        reviewedBy: isApproved || l.status === "rejected" ? adminUser._id : null,
        reviewedOn: isApproved || l.status === "rejected" ? new Date() : null,
        assignedTo: isApproved ? bdeRavi._id : null,
        assignedName: isApproved ? bdeRavi.name : null,
        assignedOn: isApproved ? new Date() : null,
        unlockedBy: isApproved ? [bdeRavi._id] : [],
      });
    }
    console.log(`Created ${SEED_LEADS.length} sample leads.`);

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
      leadCompany: "ABC Hospitals Pvt Ltd",
      description: "Unlocked lead contact details",
    });

    console.log("\n==========================================");
    console.log("DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("==========================================");
    console.log("You can now log in with these credentials:");
    console.log(`Password for all demo accounts: ${DEFAULT_PASSWORD}`);
    console.log("1. Master Admin:        sriram@arahinfotech.com");
    console.log("2. Research Analyst:    priya.m@arahinfotech.com");
    console.log("3. Business Dev (BDE):  ravi.kumar@arahinfotech.com");
    console.log("==========================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seedDatabase();
