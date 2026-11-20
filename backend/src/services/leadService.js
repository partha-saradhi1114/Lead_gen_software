import { leadStore } from "../models/store.js";

export const leadService = {
  getLeads(query) {
    return leadStore.getLeads(query);
  },

  getLeadById(id) {
    return leadStore.getLeadById(id);
  },

  approveLeads(ids) {
    return leadStore.approveLeads(ids);
  },

  rejectLeads(ids, reason) {
    return leadStore.rejectLeads(ids, reason);
  },

  allocateCredits(bde, amount) {
    return leadStore.allocateCredits(bde, amount);
  },

  uploadBatch(batch, rows) {
    return leadStore.addBatch(batch, rows);
  },

  getBatches() {
    return leadStore.getBatches();
  },

  getKpis() {
    return leadStore.getKpis();
  },

  getCredits() {
    return leadStore.getCredits();
  },

  getTeam() {
    return leadStore.getTeam();
  },

  addTeamMember(member) {
    return leadStore.addTeamMember(member);
  },

  getBdes() {
    return leadStore.getBdes();
  },

  getFullState() {
    return leadStore.getState();
  },

  unlockLead(id, bde) {
    return leadStore.unlockLead(id, bde);
  },

  updateLead(id, updates) {
    return leadStore.updateLead(id, updates);
  },

  requestCredits(bde, amount, reason) {
    return leadStore.requestCredits(bde, amount, reason);
  },
};
