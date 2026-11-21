import mongoose from "mongoose";
import { Lead } from "../models/Lead.js";
import { Batch } from "../models/Batch.js";
import { User } from "../models/User.js";
import { CreditTransaction } from "../models/CreditTransaction.js";

// Helper to convert Mongo document into standard frontend shape
function mapLead(l) {
  const obj = l.toObject ? l.toObject() : l;
  return {
    ...obj,
    id: obj._id.toString(),
    uploadedOn: obj.uploadedOn ? new Date(obj.uploadedOn).toISOString().split("T")[0] : "",
    reviewedOn: obj.reviewedOn ? new Date(obj.reviewedOn).toISOString().split("T")[0] : null,
  };
}

export const leadService = {
  async getLeads(query = {}) {
    const filter = {};
    if (query.status && query.status !== "all") filter.status = query.status;
    if (query.source && query.source !== "all") filter.source = query.source;
    if (query.researcher && query.researcher !== "all") filter.uploaderName = query.researcher;
    if (query.search) {
      const reg = new RegExp(query.search, "i");
      filter.$or = [{ company: reg }, { contact: reg }, { phone: reg }, { email: reg }];
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const [total, leads] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit),
    ]);

    return {
      total,
      leads: leads.map(mapLead),
      limit,
      offset,
    };
  },

  async getLeadById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const lead = await Lead.findById(id);
    return lead ? mapLead(lead) : null;
  },

  async approveLeads(ids) {
    const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const result = await Lead.updateMany(
      { _id: { $in: objectIds } },
      { $set: { status: "approved", reviewedOn: new Date() } }
    );
    return { modifiedCount: result.modifiedCount, approvedIds: ids };
  },

  async rejectLeads(ids, reason) {
    const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const result = await Lead.updateMany(
      { _id: { $in: objectIds } },
      {
        $set: { status: "rejected", rejectionReason: reason, reviewedOn: new Date() },
        $push: { rejectionHistory: { reason, rejectedOn: new Date() } },
      }
    );
    return { modifiedCount: result.modifiedCount, rejectedIds: ids, reason };
  },

  async allocateCredits(bdeIdentifier, amount) {
    const numAmount = Number(amount);
    let user;
    if (mongoose.Types.ObjectId.isValid(bdeIdentifier)) {
      user = await User.findById(bdeIdentifier);
    } else {
      user = await User.findOne({ name: bdeIdentifier, role: "bde" });
    }

    if (!user) {
      throw new Error(`BDE '${bdeIdentifier}' not found`);
    }

    user.credits = (user.credits || 0) + numAmount;
    await user.save();

    await CreditTransaction.create({
      bdeId: user._id,
      bdeName: user.name,
      amount: numAmount,
      type: "allocation",
      balanceAfter: user.credits,
      description: `Manual allocation of ${numAmount} credits by Admin`,
    });

    return {
      bde: user.name,
      allocated: numAmount,
      newBalance: user.credits,
    };
  },

  async uploadBatch(batchInfo, rows = []) {
    const batchId = batchInfo.id || `BATCH-${Date.now()}`;
    const batch = await Batch.create({
      batchId,
      fileName: batchInfo.fileName || "leads_upload.xlsx",
      uploaderName: batchInfo.uploadedBy || "Research Analyst",
      totalRows: rows.length,
      pendingCount: rows.length,
      status: "pending",
    });

    const leadsToInsert = rows.map((r) => ({
      company: r.company || "Unknown Company",
      contact: r.contact || "Unknown Contact",
      designation: r.designation || "Decision Maker",
      email: r.email || "",
      phone: r.phone || "",
      location: r.location || "Hyderabad",
      industry: r.industry || "Information Technology",
      source: r.source || "Excel Upload",
      batchId,
      uploaderName: batchInfo.uploadedBy || "Research Analyst",
      status: "pending",
      stage: "new",
    }));

    if (leadsToInsert.length > 0) {
      await Lead.insertMany(leadsToInsert);
    }

    return {
      batch: batch.toObject(),
      insertedCount: leadsToInsert.length,
    };
  },

  async getBatches() {
    const batches = await Batch.find().sort({ uploadedOn: -1 });
    return batches.map((b) => b.toObject());
  },

  async getKpis() {
    const [total, pending, approved, rejected, bdes] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ status: "pending" }),
      Lead.countDocuments({ status: "approved" }),
      Lead.countDocuments({ status: "rejected" }),
      User.find({ role: "bde" }),
    ]);

    let creditsAllocated = 0;
    let creditsUsed = 0;
    for (const b of bdes) {
      creditsAllocated += (b.credits || 0) + (b.creditsUsed || 0);
      creditsUsed += b.creditsUsed || 0;
    }

    return {
      total,
      pending,
      approved,
      rejected,
      creditsAllocated,
      creditsUsed,
      availableCredits: creditsAllocated - creditsUsed,
    };
  },

  async getCredits() {
    const bdes = await User.find({ role: "bde" }).select("-password");
    return bdes.map((u) => ({
      bde: u.name,
      allocated: u.credits + u.creditsUsed,
      used: u.creditsUsed,
      available: u.credits,
    }));
  },

  async getTeam() {
    const users = await User.find().select("-password").sort({ name: 1 });
    return users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role === "admin" ? "Master Admin" : u.role === "ra" ? "Research Analyst" : "BDE",
      credits: u.credits,
      creditsUsed: u.creditsUsed,
      active: u.active,
    }));
  },

  async unlockLead(leadId, bdeName) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new Error("Lead not found");

    const user = await User.findOne({ name: bdeName, role: "bde" });
    if (!user) throw new Error("BDE user not found");

    if (user.credits < 10) {
      throw new Error("Insufficient credits. 10 credits required to unlock.");
    }

    // Deduct 10 credits
    user.credits -= 10;
    user.creditsUsed += 10;
    await user.save();

    // Mark unlocked
    if (!lead.unlockedBy.includes(user._id)) {
      lead.unlockedBy.push(user._id);
      await lead.save();
    }

    await CreditTransaction.create({
      bdeId: user._id,
      bdeName: user.name,
      amount: -10,
      type: "unlock",
      balanceAfter: user.credits,
      leadId: lead._id,
      leadCompany: lead.company,
      description: `Unlocked lead ${lead.company} (-10 credits)`,
    });

    return mapLead(lead);
  },

  async updateLead(leadId, updates) {
    const lead = await Lead.findByIdAndUpdate(leadId, { $set: updates }, { new: true });
    return lead ? mapLead(lead) : null;
  },

  async getFullState() {
    const [leads, batches, bdeUsers, allUsers] = await Promise.all([
      Lead.find().sort({ createdAt: -1 }),
      Batch.find().sort({ uploadedOn: -1 }),
      User.find({ role: "bde" }),
      User.find().select("-password"),
    ]);

    let totalAllocated = 0;
    let totalUsed = 0;
    const bdes = bdeUsers.map((b) => {
      const allocated = (b.credits || 0) + (b.creditsUsed || 0);
      const used = b.creditsUsed || 0;
      totalAllocated += allocated;
      totalUsed += used;
      return {
        name: b.name,
        allocated,
        used,
      };
    });

    const team = allUsers.map((u) => ({
      name: u.name,
      email: u.email,
      phone: "+91 90000 00000",
      role: u.role === "admin" ? "Master Admin" : u.role === "ra" ? "Research Analyst" : "BDE",
    }));

    return {
      leads: leads.map(mapLead),
      batches: batches.map((b) => b.toObject()),
      credits: { allocated: totalAllocated, used: totalUsed },
      bdes,
      team,
    };
  },
};
