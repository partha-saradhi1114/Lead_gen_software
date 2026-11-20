import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { api } from "../api";
import { buildSeedBatches, buildSeedLeads, SEED_BDES, SEED_CREDITS, SEED_TEAM } from "./data";
import { buildSeedAssignments } from "./bde";
import { leadGenReducer, selectKpis } from "./reducer";

function initState() {
  const leads = buildSeedLeads();
  return {
    leads,
    bdes: SEED_BDES,
    credits: SEED_CREDITS,
    team: SEED_TEAM,
    batches: buildSeedBatches(leads),
    dateRange: "Last 30 Days",
    nextId: leads.length + 1,
    assignments: buildSeedAssignments(leads, SEED_BDES),
    creditLog: [],
  };
}

const LeadGenContext = createContext(null);

export function LeadGenProvider({ children }) {
  const [state, localDispatch] = useReducer(leadGenReducer, undefined, initState);

  useEffect(() => {
    // Attempt to sync full state from Express backend if running
    api
      .getFullState()
      .then((serverState) => {
        if (serverState && Array.isArray(serverState.leads) && serverState.leads.length > 0) {
          localDispatch({ type: "hydrate", state: serverState });
        }
      })
      .catch(() => {
        // Fall back gracefully to local in-memory seed data
      });
  }, []);

  const dispatch = (action) => {
    // Immediate responsive local state update
    localDispatch(action);

    // Sync mutations with Express backend
    switch (action.type) {
      case "approve":
        api.approveLeads(action.ids).catch(() => {});
        break;
      case "reject":
        api.rejectLeads(action.ids, action.reason).catch(() => {});
        break;
      case "allocate":
        api.allocateCredits(action.bde, action.amount).catch(() => {});
        break;
      case "addMember":
        api.addTeamMember(action.member).catch(() => {});
        break;
      case "submitBatch":
        api.uploadBatch(action.batch, action.rows).catch(() => {});
        break;
      case "bde/unlock":
        api.unlockLead(action.leadId, action.bde).catch(() => {});
        break;
      case "bde/updateLead":
        api.updateLead(action.leadId, action.updates).catch(() => {});
        break;
      case "bde/requestCredits":
        api.requestCredits(action.bde, action.amount, action.reason).catch(() => {});
        break;
      default:
        break;
    }
  };

  const kpis = useMemo(() => selectKpis(state), [state]);
  const value = useMemo(() => ({ state, dispatch, kpis }), [state, kpis]);
  return <LeadGenContext.Provider value={value}>{children}</LeadGenContext.Provider>;
}

export function useLeadGen() {
  const ctx = useContext(LeadGenContext);
  if (!ctx) throw new Error("useLeadGen must be used inside LeadGenProvider");
  return ctx;
}
