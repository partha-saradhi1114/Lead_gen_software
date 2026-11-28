import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { api } from "../api";
import {
  buildSeedBatches,
  buildSeedLeads,
  LEAD_CATEGORIES,
  SEED_BDES,
  SEED_CREDITS,
  SEED_TEAM,
  getMemberCategory,
} from "./data";
import { buildSeedAssignments } from "./bde";
import { leadGenReducer, selectKpis } from "./reducer";

export const DEFAULT_SETTINGS = {
  general: {
    workspaceName: "Lead Generation Software",
    orgDomain: "leadgen.pro",
    contactEmail: "admin@leadgen.pro",
    timezone: "Asia/Kolkata",
    currency: "INR",
  },
  credits: {
    costPerUnlock: 10,
    defaultMonthlyQuota: 500,
    lowCreditThreshold: 50,
    autoDebitOnUnlock: true,
    requireApprovalForTopup: false,
  },
  rules: {
    strictPhoneValidation: true,
    requireBusinessEmail: true,
    autoDeduplicate: true,
    maxBatchSize: 500,
    autoArchiveRejectedAfterDays: 30,
  },
  notifications: {
    emailOnUpload: true,
    emailOnReview: false,
    lowCreditAlerts: true,
    dailyDigest: true,
    inAppPopups: true,
  },
};

export function loadStoredSettings() {
  try {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem("leadgen_settings")
        : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        general: { ...DEFAULT_SETTINGS.general, ...(parsed.general || {}) },
        credits: { ...DEFAULT_SETTINGS.credits, ...(parsed.credits || {}) },
        rules: { ...DEFAULT_SETTINGS.rules, ...(parsed.rules || {}) },
        notifications: {
          ...DEFAULT_SETTINGS.notifications,
          ...(parsed.notifications || {}),
        },
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function loadStoredTeam() {
  try {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem("leadgen_team")
        : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingEmails = new Set(
          SEED_TEAM.map((m) => m.email?.toLowerCase()),
        );
        const custom = parsed.filter(
          (m) => m && m.email && !existingEmails.has(m.email.toLowerCase()),
        );
        const enrichedCustom = custom.map((m) => {
          const category = getMemberCategory(m);
          return {
            ...m,
            category,
            department: category,
          };
        });
        const enrichedSeed = SEED_TEAM.map((m) => {
          const category = getMemberCategory(m);
          return {
            ...m,
            category,
            department: category,
          };
        });
        return [...enrichedSeed, ...enrichedCustom];
      }
    }
  } catch {
    // ignore
  }
  return SEED_TEAM.map((m) => {
    const category = getMemberCategory(m);
    return {
      ...m,
      category,
      department: category,
    };
  });
}

function initState() {
  const leads = buildSeedLeads();
  return {
    leads,
    bdes: SEED_BDES,
    credits: SEED_CREDITS,
    team: loadStoredTeam(),
    batches: buildSeedBatches(leads),
    dateRange: "Last 30 Days",
    nextId: leads.length + 1,
    assignments: buildSeedAssignments(leads, SEED_BDES),
    creditLog: [],
    settings: loadStoredSettings(),
  };
}

let defaultFallback = null;
export function getFallbackStore() {
  if (!defaultFallback) {
    const state = initState();
    defaultFallback = {
      state,
      dispatch: (action) => {
        if (defaultFallback.state) {
          defaultFallback.state = leadGenReducer(defaultFallback.state, action);
          defaultFallback.kpis = selectKpis(defaultFallback.state);
        }
      },
      kpis: selectKpis(state),
    };
  }
  return defaultFallback;
}

export const LeadGenContext = createContext(null);

export function LeadGenProvider({ children }) {
  const [state, localDispatch] = useReducer(
    leadGenReducer,
    undefined,
    initState,
  );

  useEffect(() => {
    // Attempt to sync full state from Express backend if running
    api
      .getFullState()
      .then((serverState) => {
        if (
          serverState &&
          Array.isArray(serverState.leads) &&
          serverState.leads.length > 0
        ) {
          const batchUploaderById = new Map();
          if (Array.isArray(serverState.batches)) {
            for (const b of serverState.batches) {
              const bid = b.id || b.batchId;
              const bName = [b.uploaderName, b.uploadedBy, b.researcher].find(
                (v) =>
                  typeof v === "string" &&
                  v.trim() &&
                  !/^[0-9a-fA-F]{24}$/.test(v.trim()) &&
                  !["research analyst", "ra", "researcher", "unknown"].includes(
                    v.trim().toLowerCase(),
                  ),
              );
              if (bid && bName) batchUploaderById.set(bid, bName.trim());
            }
          }

          const isValidUploaderName = (val) =>
            typeof val === "string" &&
            val.trim().length > 0 &&
            !/^[0-9a-fA-F]{24}$/.test(val.trim()) &&
            !["research analyst", "ra", "researcher", "unknown"].includes(
              val.trim().toLowerCase(),
            );

          const sanitizedLeads = serverState.leads.map((l, idx) => {
            const cleanName =
              (isValidUploaderName(l.uploaderName) && l.uploaderName.trim()) ||
              (isValidUploaderName(l.uploadedBy) && l.uploadedBy.trim()) ||
              (isValidUploaderName(l.researcher) && l.researcher.trim()) ||
              (l.batchId && batchUploaderById.get(l.batchId)) ||
              ["Priya M", "Arjun K", "Neha R"][idx % 3];

            const category =
              l.category ||
              (l.industry === "Higher Education" ||
              (l.company && l.company.includes("University")) ||
              (l.company && l.company.includes("College"))
                ? "Students / Education"
                : LEAD_CATEGORIES[idx % LEAD_CATEGORIES.length]);

            return {
              ...l,
              category,
              uploadedBy: cleanName,
              uploaderName: cleanName,
            };
          });

          const sanitizedBatches = Array.isArray(serverState.batches)
            ? serverState.batches.map((b) => ({
                ...b,
                id: b.id || b.batchId,
                totalRecords: b.totalRecords ?? b.totalRows ?? 0,
                validRecords: b.validRecords ?? b.totalRows ?? 0,
                duplicates: b.duplicates ?? 0,
                invalidRecords: b.invalidRecords ?? 0,
              }))
            : undefined;

          const sanitizedTeam = Array.isArray(serverState.team)
            ? serverState.team.map((m) => {
                const localMember = state.team.find(
                  (tm) =>
                    tm.email?.toLowerCase() === m.email?.toLowerCase() ||
                    tm.name?.toLowerCase() === m.name?.toLowerCase(),
                );
                const category =
                  (m.category && m.category.trim()) ||
                  (localMember?.category && localMember.category.trim()) ||
                  getMemberCategory(m);
                return {
                  ...m,
                  category,
                  department: category,
                  phone:
                    (m.phone && m.phone !== "+91 90000 00000"
                      ? m.phone
                      : localMember?.phone) ||
                    m.phone ||
                    "+91 90000 00000",
                };
              })
            : undefined;

          // Keep existing local customized settings if server has default seed
          const currentLocalSettings = loadStoredSettings();
          const serverSettings = serverState.settings;
          let mergedSettings = currentLocalSettings;
          if (serverSettings && typeof serverSettings === "object") {
            mergedSettings = {
              ...currentLocalSettings,
              ...serverSettings,
              general: {
                ...currentLocalSettings.general,
                ...(serverSettings.general || {}),
                workspaceName:
                  currentLocalSettings.general?.workspaceName &&
                  currentLocalSettings.general?.workspaceName !== "Lead Generation Software" &&
                  serverSettings.general?.workspaceName === "Lead Generation Software"
                    ? currentLocalSettings.general.workspaceName
                    : serverSettings.general?.workspaceName ||
                      currentLocalSettings.general?.workspaceName,
              },
            };
          }

          localDispatch({
            type: "hydrate",
            state: {
              ...serverState,
              leads: sanitizedLeads,
              ...(sanitizedBatches ? { batches: sanitizedBatches } : {}),
              ...(sanitizedTeam ? { team: sanitizedTeam } : {}),
              settings: mergedSettings,
            },
          });
        }
      })
      .catch(() => {
        // Fall back gracefully to local in-memory seed data
      });

    api
      .getSettings?.()
      .then((serverSettings) => {
        if (
          serverSettings &&
          typeof serverSettings === "object" &&
          Object.keys(serverSettings).length > 0
        ) {
          const currentStored = loadStoredSettings();
          for (const [section, values] of Object.entries(serverSettings)) {
            if (values && typeof values === "object") {
              const cleanValues = { ...values };
              if (
                section === "general" &&
                currentStored.general?.workspaceName &&
                currentStored.general.workspaceName !== "Lead Generation Software" &&
                cleanValues.workspaceName === "Lead Generation Software"
              ) {
                cleanValues.workspaceName = currentStored.general.workspaceName;
                api.updateSettings?.("general", {
                  workspaceName: cleanValues.workspaceName,
                }).catch(() => {});
              }
              localDispatch({
                type: "updateSettings",
                section,
                values: cleanValues,
              });
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  // Synchronize settings changes to localStorage and dynamic document tab title
  useEffect(() => {
    if (state.settings) {
      try {
        localStorage.setItem(
          "leadgen_settings",
          JSON.stringify(state.settings),
        );
      } catch (_e) {
        // ignore localStorage errors
      }
      if (typeof document !== "undefined") {
        document.title = "Lead Generation Software";
      }
    }
  }, [state.settings]);

  // Synchronize team changes to localStorage
  useEffect(() => {
    if (state.team && Array.isArray(state.team)) {
      try {
        localStorage.setItem("leadgen_team", JSON.stringify(state.team));
      } catch (_e) {
        // ignore
      }
    }
  }, [state.team]);

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
      case "allocateLeads":
        api.assignLeads(action.leadIds, action.bde).catch(() => {});
        break;
      case "addMember":
        api.addTeamMember(action.member).catch(() => {});
        break;
      case "submitBatch":
        api.uploadBatch(action.batch, action.rows).catch(() => {});
        break;
      case "resubmit":
        api
          .updateLead(action.id, {
            ...action.changes,
            status: "pending",
            rejectionReason: null,
            reviewedOn: null,
          })
          .catch(() => {});
        break;
      case "bdeUnlock":
      case "bde/unlock":
        api.unlockLead(action.leadId, action.bde).catch(() => {});
        break;
      case "bdeUpdate":
      case "bde/updateLead":
        api
          .updateLead(action.leadId, {
            stage: action.stage,
            notes: action.note || action.notes,
            followUpDate: action.followUpOn || action.followUpDate,
          })
          .catch(() => {});
        break;
      case "bdeCompleteFollowUp":
        api
          .updateLead(action.leadId, {
            followUpDone: true,
            notes: action.note,
          })
          .catch(() => {});
        break;
      case "bdeRequestCredits":
      case "bde/requestCredits":
        api
          .requestCredits(action.bde, action.amount, action.reason)
          .catch(() => {});
        break;
      case "updateSettings":
        api.updateSettings?.(action.section, action.values).catch(() => {});
        break;
      default:
        break;
    }
  };

  const kpis = useMemo(() => selectKpis(state), [state]);
  const value = useMemo(() => ({ state, dispatch, kpis }), [state, kpis]);
  return (
    <LeadGenContext.Provider value={value}>{children}</LeadGenContext.Provider>
  );
}

export function useLeadGen() {
  const ctx = useContext(LeadGenContext);
  if (!ctx) {
    return getFallbackStore();
  }
  return ctx;
}
