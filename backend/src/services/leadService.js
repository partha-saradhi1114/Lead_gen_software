import mongoose from "mongoose";
import { getDbStatus } from "../config/db.js";
import { leadStore } from "../models/store.js";
import { Lead } from "../models/Lead.js";
import { Batch } from "../models/Batch.js";
import { User } from "../models/User.js";
import { CreditTransaction } from "../models/CreditTransaction.js";

// Helper to convert Mongo document into standard frontend shape
function mapLead(l) {
  const obj = l.toObject ? l.toObject() : l;
  return {
    ...obj,
    id: obj._id ? obj._id.toString() : obj.id,
    category: obj.category || "Students / Education",
    country: obj.country || "India",
    stateCity: obj.stateCity || obj.location || "",
    companyAddress: obj.companyAddress || "",
    website: obj.website || "",
    linkedin: obj.linkedin || "",
    description: obj.description || obj.notes || "",
    uploadedOn: obj.uploadedOn ? new Date(obj.uploadedOn).toISOString().split("T")[0] : "",
    reviewedOn: obj.reviewedOn ? new Date(obj.reviewedOn).toISOString().split("T")[0] : null,
    followUpDate: obj.followUpDate ? new Date(obj.followUpDate).toISOString().split("T")[0] : undefined,
    unlockedBy: Array.isArray(obj.unlockedBy)
      ? obj.unlockedBy.map((u) => {
          if (u && typeof u === "object") {
            return u.name || u._id?.toString() || String(u);
          }
          return String(u);
        })
      : [],
  };
}

export const leadService = {
  async getLeads(query = {}) {
    if (!getDbStatus()) {
      const res = leadStore.getLeads(query);
      return {
        total: res.total,
        leads: res.items,
        limit: res.limit,
        offset: res.offset,
      };
    }

    try {
      const filter = {};
      if (query.status && query.status !== "all") filter.status = query.status;
      if (query.source && query.source !== "all") filter.source = query.source;
      if (query.category && query.category !== "all") filter.category = query.category;
      if (query.researcher && query.researcher !== "all") {
        filter.$or = [{ uploaderName: query.researcher }, { uploadedBy: query.researcher }];
      }
      if (query.assignedBde && query.assignedBde !== "all") {
        filter.$or = [{ assignedName: query.assignedBde }, { assignedTo: query.assignedBde }];
      }
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
    } catch (err) {
      console.warn("[leadService.getLeads] Falling back to store:", err.message);
      const res = leadStore.getLeads(query);
      return { total: res.total, leads: res.items, limit: res.limit, offset: res.offset };
    }
  },

  async getLeadById(id) {
    if (!getDbStatus()) {
      return leadStore.getLeadById(id);
    }

    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return leadStore.getLeadById(id);
      }
      const lead = await Lead.findById(id);
      return lead ? mapLead(lead) : leadStore.getLeadById(id);
    } catch (err) {
      return leadStore.getLeadById(id);
    }
  },

  async approveLeads(ids) {
    // Always update store
    const storeRes = leadStore.approveLeads(ids);

    if (getDbStatus()) {
      try {
        const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
        if (objectIds.length > 0) {
          const result = await Lead.updateMany(
            { _id: { $in: objectIds } },
            { $set: { status: "approved", reviewedOn: new Date() } }
          );
          return { modifiedCount: result.modifiedCount, approvedIds: ids };
        }
      } catch (err) {
        console.warn("[leadService.approveLeads] Mongo error:", err.message);
      }
    }

    return storeRes;
  },

  async rejectLeads(ids, reason) {
    const storeRes = leadStore.rejectLeads(ids, reason);

    if (getDbStatus()) {
      try {
        const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
        if (objectIds.length > 0) {
          const result = await Lead.updateMany(
            { _id: { $in: objectIds } },
            {
              $set: { status: "rejected", rejectionReason: reason, reviewedOn: new Date() },
              $push: { rejectionHistory: { reason, rejectedOn: new Date() } },
            }
          );
          return { modifiedCount: result.modifiedCount, rejectedIds: ids, reason };
        }
      } catch (err) {
        console.warn("[leadService.rejectLeads] Mongo error:", err.message);
      }
    }

    return storeRes;
  },

  async allocateCredits(bdeIdentifier, amount) {
    const numAmount = Number(amount);
    const storeRes = leadStore.allocateCredits(bdeIdentifier, numAmount);

    if (getDbStatus()) {
      try {
        let user;
        if (mongoose.Types.ObjectId.isValid(bdeIdentifier)) {
          user = await User.findById(bdeIdentifier);
        } else {
          user = await User.findOne({ name: bdeIdentifier, role: "bde" });
        }

        if (user) {
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
        }
      } catch (err) {
        console.warn("[leadService.allocateCredits] Mongo error:", err.message);
      }
    }

    return storeRes;
  },

  async assignLeads(leadIds, bdeName) {
    const storeRes = leadStore.assignLeads(leadIds, bdeName);

    if (getDbStatus()) {
      try {
        const user = await User.findOne({ name: bdeName, role: "bde" });
        const objectIds = leadIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
        if (objectIds.length > 0) {
          const result = await Lead.updateMany(
            { _id: { $in: objectIds } },
            {
              $set: {
                assignedTo: user ? user._id : null,
                assignedName: bdeName,
                assignedOn: new Date(),
              },
            }
          );
          return {
            modifiedCount: result.modifiedCount,
            bde: bdeName,
            leadIds,
          };
        }
      } catch (err) {
        console.warn("[leadService.assignLeads] Mongo error:", err.message);
      }
    }

    return storeRes;
  },

  async uploadBatch(batchInfo, rows = []) {
    const storeRes = leadStore.addBatch(batchInfo, rows);

    if (getDbStatus()) {
      try {
        const batchId = batchInfo.id || `BATCH-${Date.now()}`;
        const category = batchInfo.category || "Students / Education";
        const batch = await Batch.create({
          batchId,
          fileName: batchInfo.fileName || "leads_upload.xlsx",
          uploaderName: batchInfo.uploadedBy || "Research Analyst",
          category,
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
          country: r.country || "India",
          stateCity: r.stateCity || r.location || "",
          companyAddress: r.companyAddress || "",
          website: r.website || "",
          linkedin: r.linkedin || "",
          description: r.description || r.notes || "",
          location: r.stateCity || r.location || "Hyderabad",
          industry: r.industry || "Information Technology",
          source: r.source || "Excel Upload",
          category: r.category || category,
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
      } catch (err) {
        console.warn("[leadService.uploadBatch] Mongo error:", err.message);
      }
    }

    return storeRes;
  },

  async getBatches() {
    if (!getDbStatus()) {
      return leadStore.getBatches();
    }
    try {
      const batches = await Batch.find().sort({ uploadedOn: -1 });
      return batches.map((b) => b.toObject());
    } catch {
      return leadStore.getBatches();
    }
  },

  async getKpis() {
    if (!getDbStatus()) {
      return leadStore.getKpis();
    }
    try {
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
        availableCredits: Math.max(0, creditsAllocated - creditsUsed),
        utilization: creditsAllocated === 0 ? 0 : Math.round((creditsUsed / creditsAllocated) * 100),
      };
    } catch {
      return leadStore.getKpis();
    }
  },

  async getCredits() {
    if (!getDbStatus()) {
      const credits = leadStore.getCredits();
      const bdes = leadStore.getBdes();
      return {
        allocated: credits.allocated,
        used: credits.used,
        bdes,
      };
    }
    try {
      const bdes = await User.find({ role: "bde" }).select("-password");
      let totalAllocated = 0;
      let totalUsed = 0;
      const bdeList = bdes.map((u) => {
        const allocated = (u.credits || 0) + (u.creditsUsed || 0);
        const used = u.creditsUsed || 0;
        totalAllocated += allocated;
        totalUsed += used;
        return {
          bde: u.name,
          name: u.name,
          allocated,
          used,
          available: u.credits,
        };
      });
      return {
        allocated: totalAllocated,
        used: totalUsed,
        bdes: bdeList,
      };
    } catch {
      return leadStore.getCredits();
    }
  },

  async getBdes() {
    if (!getDbStatus()) {
      return leadStore.getBdes();
    }
    try {
      const bdes = await User.find({ role: "bde" }).select("-password");
      return bdes.map((u) => ({
        bde: u.name,
        name: u.name,
        allocated: (u.credits || 0) + (u.creditsUsed || 0),
        used: u.creditsUsed || 0,
        available: u.credits || 0,
      }));
    } catch {
      return leadStore.getBdes();
    }
  },

  async getTeam() {
    if (!getDbStatus()) {
      return leadStore.getTeam();
    }
    try {
      const users = await User.find().select("-password").sort({ name: 1 });
      if (users.length === 0) return leadStore.getTeam();
      return users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone || "+91 90000 00000",
        role: u.role === "admin" ? "Master Admin" : u.role === "ra" ? "Research Analyst" : "BDE",
        credits: u.credits,
        creditsUsed: u.creditsUsed,
        active: u.active,
      }));
    } catch {
      return leadStore.getTeam();
    }
  },

  async addTeamMember(member) {
    const storeMember = leadStore.addTeamMember(member);
    if (getDbStatus()) {
      try {
        const roleSlug = member.role.toLowerCase().includes("admin")
          ? "admin"
          : member.role.toLowerCase().includes("ra") || member.role.toLowerCase().includes("analyst")
          ? "ra"
          : "bde";

        await User.create({
          name: member.name,
          email: member.email.toLowerCase(),
          phone: member.phone || "",
          password: member.password,
          role: roleSlug,
          department:
            member.department ||
            (roleSlug === "bde"
              ? "Business Development"
              : "Market Research"),
          active: (member.status || "Active").toLowerCase() === "active",
          credits: roleSlug === "bde" ? 500 : 0,
        });
      } catch (err) {
        console.warn("[leadService.addTeamMember] Mongo error:", err.message);
      }
    }
    return storeMember;
  },

  async unlockLead(leadId, bdeName) {
    let storeLead = null;
    try {
      storeLead = leadStore.unlockLead(leadId, bdeName);
    } catch {
      // In-memory store might not have this lead if it was added directly in MongoDB
    }

    if (getDbStatus() && mongoose.Types.ObjectId.isValid(leadId)) {
      try {
        const lead = await Lead.findById(leadId);
        const user = await User.findOne({
          name: new RegExp(`^${bdeName}$`, "i"),
          role: "bde",
        });
        if (lead && user && user.credits >= 1) {
          user.credits -= 1;
          user.creditsUsed = (user.creditsUsed || 0) + 1;
          await user.save();

          lead.unlockedBy = lead.unlockedBy || [];
          const userIdStr = user._id.toString();
          const alreadyUnlocked = lead.unlockedBy.some(
            (u) => (u._id ? u._id.toString() : u.toString()) === userIdStr
          );
          if (!alreadyUnlocked) {
            lead.unlockedBy.push(user._id);
            await lead.save();
          }

          await CreditTransaction.create({
            bdeId: user._id,
            bdeName: user.name,
            amount: -1,
            type: "unlock",
            balanceAfter: user.credits,
            leadId: lead._id,
            leadCompany: lead.company,
            description: `Unlocked lead ${lead.company} (-1 credit)`,
          });

          if (!storeLead) {
            storeLead = mapLead(lead);
          }
        }
      } catch (err) {
        console.warn("[leadService.unlockLead] Mongo error:", err.message);
      }
    }

    if (!storeLead) {
      throw new Error("Lead not found");
    }

    return storeLead;
  },

  async updateLead(leadId, updates) {
    let storeLead = null;
    try {
      storeLead = leadStore.updateLead(leadId, updates);
    } catch {
      // In-memory store might not have this lead if it was added directly in MongoDB
    }

    if (getDbStatus() && mongoose.Types.ObjectId.isValid(leadId)) {
      try {
        const mongoLead = await Lead.findByIdAndUpdate(
          leadId,
          { $set: updates },
          { new: true }
        );
        if (!storeLead && mongoLead) {
          storeLead = mapLead(mongoLead);
        }
      } catch (err) {
        console.warn("[leadService.updateLead] Mongo error:", err.message);
      }
    }

    if (!storeLead) {
      throw new Error("Lead not found");
    }

    return storeLead;
  },

  async requestCredits(bdeName, amount, reason) {
    return leadStore.requestCredits(bdeName, amount, reason);
  },

  async getFullState() {
    const state = leadStore.getState();

    if (getDbStatus()) {
      try {
        const [leads, batches, bdeUsers, allUsers] = await Promise.all([
          Lead.find().populate("unlockedBy", "name email").sort({ createdAt: -1 }),
          Batch.find().sort({ uploadedOn: -1 }),
          User.find({ role: "bde" }),
          User.find().select("-password"),
        ]);

        if (leads.length > 0) {
          let totalAllocated = 0;
          let totalUsed = 0;

          const bdeMap = new Map();
          (state.bdes || []).forEach((b) => {
            bdeMap.set(b.name.toLowerCase(), {
              name: b.name,
              allocated: b.allocated || 500,
              used: b.used || 0,
            });
          });

          bdeUsers.forEach((b) => {
            const allocated = (b.credits || 0) + (b.creditsUsed || 0);
            const used = b.creditsUsed || 0;
            bdeMap.set(b.name.toLowerCase(), {
              name: b.name,
              allocated: allocated || 500,
              used,
            });
          });

          const bdes = Array.from(bdeMap.values()).map((b) => {
            totalAllocated += b.allocated;
            totalUsed += b.used;
            return b;
          });

          const seedPhones = {
            Sriram: "+91 98450 12345",
            "Priya M": "+91 90000 11111",
            "Arjun K": "+91 90000 22222",
            "Neha R": "+91 90000 33333",
            "Ravi Kumar": "+91 90000 44444",
            "Anitha Reddy": "+91 90000 55555",
            "Kiran Varma": "+91 90000 66666",
            "Megha S": "+91 90000 77777",
          };
          const team = allUsers.map((u) => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            phone: u.phone || seedPhones[u.name] || "+91 90000 00000",
            role: u.role === "admin" ? "Master Admin" : u.role === "ra" ? "Research Analyst" : "BDE",
          }));

          return {
            leads: leads.map(mapLead),
            batches: batches.map((b) => {
              const obj = b.toObject ? b.toObject() : b;
              return {
                ...obj,
                id: obj.batchId || obj._id?.toString() || obj.id,
                totalRecords: obj.totalRecords ?? obj.totalRows ?? 0,
                validRecords: obj.validRecords ?? obj.totalRows ?? 0,
                duplicates: obj.duplicates ?? 0,
                invalidRecords: obj.invalidRecords ?? 0,
                approved: obj.approvedCount ?? obj.approved ?? 0,
                rejected: obj.rejectedCount ?? obj.rejected ?? 0,
                pending: obj.pendingCount ?? obj.pending ?? 0,
              };
            }),
            credits: { allocated: totalAllocated, used: totalUsed },
            bdes,
            team,
            assignments: state.assignments,
            creditLog: state.creditLog,
            settings: state.settings,
          };
        }
      } catch (err) {
        console.warn("[leadService.getFullState] Mongo error, returning store state:", err.message);
      }
    }

    return state;
  },
};
