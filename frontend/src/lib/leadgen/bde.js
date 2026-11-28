import { TODAY, currentDate, isoDaysBefore } from "./data";

/** Sample signed-in BDE until real roles arrive with the backend. */
export const CURRENT_BDE = "Ravi Kumar";

export const BDE_STAGE_GROUPS = [
  {
    name: "Interested & Pipeline Progress",
    stages: [
      "Connected – Interested",
      "Meeting Scheduled",
      "Demo Required",
      "Proposal / Quotation Sent",
      "Negotiation",
      "Decision Pending",
      "Approval Pending",
      "Budget Pending",
      "Requirement Pending",
      "Payment Pending",
    ],
  },
  {
    name: "Follow-up & Channel Preference",
    stages: [
      "Call Back Requested",
      "Follow-up Required",
      "Asked to Contact via WhatsApp",
      "Email Details Requested",
      "Waiting for Response",
      "Processing",
    ],
  },
  {
    name: "Call Connectivity & Reachability",
    stages: [
      "No Answer",
      "Switched Off",
      "Not Reachable",
      "Busy",
      "Call Disconnected",
      "Out of Coverage",
      "Contact Person Unavailable",
    ],
  },
  {
    name: "Successful Conversion",
    stages: ["Converted"],
  },
  {
    name: "Disqualified & Lost",
    stages: [
      "Connected – Not Interested",
      "Lost",
      "Rejected",
      "Contact Person Changed",
      "Do Not Contact",
      "Duplicate Lead",
      "No Current Requirement",
      "Already Using Competitor",
      "Budget Issue",
      "Wrong Number",
      "Number Does Not Exist",
      "Invalid Lead",
    ],
  },
];

export const BDE_DISPOSITIONS = BDE_STAGE_GROUPS.flatMap((g) => g.stages);

export const BDE_STAGES = ["New", ...BDE_DISPOSITIONS];

/** Revealing a lead's phone and email costs one credit. */
export const UNLOCK_COST = 1;

export function normalizeStage(s) {
  if (!s) return "New";
  const str = String(s).trim().toLowerCase();
  if (str === "new") return "New";
  if (str === "interested") return "Interested";
  if (str === "connected") return "Connected";
  if (
    str === "connected - interested" ||
    str === "connected – interested"
  )
    return "Connected – Interested";
  if (
    str === "connected - not interested" ||
    str === "connected – not interested" ||
    str === "not interested" ||
    str === "not_interested"
  )
    return "Connected – Not Interested";
  if (str === "converted" || str === "closed" || str === "closed won")
    return "Converted";

  // Check exact case-insensitive match against all 36 dispositions
  const matched = BDE_DISPOSITIONS.find(
    (d) =>
      d.toLowerCase() === str ||
      d.toLowerCase().replace(/–|-/g, " ") === str.replace(/–|-/g, " "),
  );
  if (matched) return matched;

  // Legacy mappings
  if (
    str === "awaiting response" ||
    str === "awaiting_response" ||
    str === "waiting for response"
  )
    return "Waiting for Response";
  if (
    str === "temporarily unavailable" ||
    str === "temporarily_unavailable" ||
    str === "out of coverage" ||
    str === "out-of-coverage"
  )
    return "Out of Coverage";
  if (str === "contacted")
    return "Connected";

  return s;
}

const INTERESTED_STAGES = new Set([
  "Connected – Interested",
  "Interested",
  "Meeting Scheduled",
  "Demo Required",
  "Proposal / Quotation Sent",
  "Negotiation",
  "Decision Pending",
  "Approval Pending",
  "Budget Pending",
  "Requirement Pending",
  "Payment Pending",
  "Converted",
]);

const CONNECTED_STAGES = new Set([
  ...INTERESTED_STAGES,
  "Connected",
  "Connected – Not Interested",
  "Call Back Requested",
  "Asked to Contact via WhatsApp",
  "Email Details Requested",
  "Contact Person Changed",
]);

const isConnected = (s) => CONNECTED_STAGES.has(normalizeStage(s));
const isInterested = (s) => INTERESTED_STAGES.has(normalizeStage(s));

/** Deterministic assignments: approved leads handed to each BDE. */
export function buildSeedAssignments(leads, bdes) {
  const approved = leads.filter((l) => l.status === "approved");
  const out = [];
  const pattern = [
    "New",
    "New",
    "Call Back Requested",
    "Connected – Interested",
    "Meeting Scheduled",
    "Connected – Not Interested",
    "Waiting for Response",
    "Converted",
    "New",
    "Follow-up Required",
  ];
  bdes.forEach((b, bi) => {
    const mine = approved.slice(bi * 48, bi * 48 + 48);
    mine.forEach((l, i) => {
      const stage = pattern[i % pattern.length];
      const assignedOn = isoDaysBefore(TODAY, (i % 14) + 1);
      const due =
        i % 3 === 0 &&
        stage !== "Not Interested" &&
        stage !== "Converted" &&
        stage !== "New"
          ? {
              on: isoDaysBefore(TODAY, (i % 7) - 3),
              note: "Call back to discuss requirement",
              done: false,
            }
          : null;
      out.push({
        leadId: l.id,
        bde: b.name,
        assignedOn,
        stage,
        unlocked: stage !== "New",
        followUp: due,
        activity: [
          { on: assignedOn, text: "Lead assigned by Master Admin" },
          ...(stage !== "New"
            ? [{ on: assignedOn, text: `Marked ${stage}` }]
            : []),
        ],
      });
    });
  });
  return out;
}

const touch = (state, leadId, bde, fn) => {
  const list = state.assignments ?? [];
  const exists = list.some(
    (a) => String(a.leadId) === String(leadId) && a.bde === bde,
  );
  const assignments = exists
    ? list.map((a) =>
        String(a.leadId) === String(leadId) && a.bde === bde ? fn(a) : a,
      )
    : [
        ...list,
        fn({
          leadId,
          bde,
          assignedOn: TODAY,
          stage: "New",
          unlocked: true,
          followUp: null,
          activity: [],
        }),
      ];
  return {
    ...state,
    assignments,
  };
};

export function bdeReducer(state, action) {
  const list = state.assignments ?? [];
  let a = list.find(
    (x) => String(x.leadId) === String(action.leadId) && x.bde === action.bde,
  );

  if (!a) {
    const lead = (state.leads || []).find(
      (l) => String(l.id) === String(action.leadId),
    );
    if (lead && (lead.assignedName === action.bde || lead.assignedTo === action.bde || (Array.isArray(lead.assignedBdes) && lead.assignedBdes.includes(action.bde)))) {
      const isUnlocked = Array.isArray(lead.unlockedBy)
        ? lead.unlockedBy.includes(action.bde)
        : Boolean(lead.unlocked);
      a = {
        leadId: lead.id,
        bde: action.bde,
        assignedOn: lead.assignedOn || TODAY,
        stage: lead.stage || "New",
        unlocked: isUnlocked,
        followUp: lead.followUpDate
          ? {
              on: lead.followUpDate,
              note: lead.notes || "Follow up",
              done: false,
            }
          : null,
        activity: [
          {
            on: TODAY,
            text: `Lead assigned by Master Admin to ${action.bde}`,
          },
        ],
      };
    }
  }

  switch (action.type) {
    case "bdeUnlock": {
      if (!a || a.unlocked) return state;
      let row = state.bdes.find(
        (b) => b.name?.toLowerCase() === action.bde?.toLowerCase(),
      );
      if (!row) {
        row = {
          name: action.bde,
          allocated: 500,
          used: 0,
          connected: 0,
          interested: 0,
        };
      }
      if (row.allocated - row.used < UNLOCK_COST) return state;
      const s = touch(state, a.leadId, a.bde, (x) => ({
        ...x,
        unlocked: true,
        activity: [
          ...x.activity,
          { on: TODAY, text: `Contact unlocked (${UNLOCK_COST} credit)` },
        ],
      }));
      const bdeExists = state.bdes.some(
        (b) => b.name?.toLowerCase() === action.bde?.toLowerCase(),
      );
      const updatedBdes = bdeExists
        ? state.bdes.map((b) =>
            b.name?.toLowerCase() === action.bde?.toLowerCase()
              ? { ...b, used: b.used + UNLOCK_COST }
              : b,
          )
        : [...state.bdes, { ...row, used: row.used + UNLOCK_COST }];

      return {
        ...s,
        leads: (state.leads || []).map((l) =>
          String(l.id) === String(action.leadId)
            ? {
                ...l,
                unlocked: true,
                unlockedBy: Array.isArray(l.unlockedBy)
                  ? [...new Set([...l.unlockedBy, action.bde])]
                  : [action.bde],
              }
            : l,
        ),
        bdes: updatedBdes,
        credits: { ...state.credits, used: state.credits.used + UNLOCK_COST },
        creditLog: [
          {
            on: TODAY,
            bde: action.bde,
            kind: "Used",
            amount: UNLOCK_COST,
            leadId: a.leadId,
          },
          ...(state.creditLog ?? []),
        ],
      };
    }
    case "bdeUpdate": {
      const normStage = normalizeStage(action.stage);
      if (
        !a ||
        !a.unlocked ||
        (!BDE_STAGES.includes(action.stage) &&
          !BDE_STAGES.includes(normStage) &&
          action.stage !== "Interested" &&
          action.stage !== "Connected")
      )
        return state;
      const finalStage = action.stage || normStage;
      const followUp = action.followUpOn
        ? {
            on: action.followUpOn,
            note: action.note?.trim() || "Follow up",
            done: false,
          }
        : a.followUp;
      const newlyConnected =
        !isConnected(a.stage) && isConnected(finalStage) ? 1 : 0;
      const newlyInterested =
        !isInterested(a.stage) && isInterested(finalStage) ? 1 : 0;
      const s = touch(state, a.leadId, a.bde, (x) => ({
        ...x,
        stage: finalStage,
        followUp,
        activity: [
          ...x.activity,
          ...(finalStage !== x.stage
            ? [{ on: TODAY, text: `Marked ${finalStage}` }]
            : []),
          ...(action.note?.trim()
            ? [{ on: TODAY, text: action.note.trim() }]
            : []),
          ...(action.followUpOn
            ? [{ on: TODAY, text: `Follow-up set for ${action.followUpOn}` }]
            : []),
        ],
      }));
      return {
        ...s,
        leads: (state.leads || []).map((l) =>
          String(l.id) === String(action.leadId)
            ? {
                ...l,
                stage: finalStage ?? l.stage,
                notes: action.note !== undefined ? action.note : l.notes,
                followUpDate:
                  action.followUpOn !== undefined
                    ? action.followUpOn
                    : l.followUpDate,
              }
            : l,
        ),
        bdes: state.bdes.map((b) =>
          b.name === action.bde
            ? {
                ...b,
                connected: b.connected + newlyConnected,
                interested: b.interested + newlyInterested,
              }
            : b,
        ),
      };
    }
    case "bdeRemindCall": {
      const bdeTarget =
        action.bde && action.bde !== "Unassigned"
          ? action.bde
          : action.assignedName || CURRENT_BDE;
      const leadIdStr = String(action.leadId);
      const notifId = `remind_${leadIdStr}`;

      const newNotif = {
        id: notifId,
        role: "bde",
        targetUser: bdeTarget,
        title: `Immediate action required: Follow up with ${action.company || "lead"}!`,
        message: `Admin requested an immediate call with ${action.company || "lead"} (${action.contact || ""}).`,
        time: "Just now",
        tone: "red",
        urgent: true,
        leadId: action.leadId,
        company: action.company,
        createdAt: new Date().toISOString(),
      };

      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const storedNotifs = JSON.parse(
            localStorage.getItem("leadgen_custom_notifications") || "[]",
          );
          // DEDUPLICATE: Filter out any existing reminder for this lead so it NEVER duplicates
          const dedupedStored = storedNotifs.filter(
            (n) => String(n.leadId) !== leadIdStr && String(n.id) !== notifId,
          );
          dedupedStored.unshift(newNotif);
          localStorage.setItem(
            "leadgen_custom_notifications",
            JSON.stringify(dedupedStored),
          );

          const remindedLeads = JSON.parse(
            localStorage.getItem("leadgen_admin_reminded_leads") || "{}",
          );
          remindedLeads[leadIdStr] = {
            bde: bdeTarget,
            remindedAt: new Date().toISOString(),
            company: action.company,
            contact: action.contact,
          };
          localStorage.setItem(
            "leadgen_admin_reminded_leads",
            JSON.stringify(remindedLeads),
          );
        }
      } catch (_e) {}

      const s = touch(state, action.leadId, bdeTarget, (x) => ({
        ...x,
        adminReminded: true,
        adminRemindedAt: new Date().toISOString(),
        followUp: x.followUp || {
          on: action.followUpDate || TODAY,
          note: action.notes || "Admin Reminder: Immediate action required!",
          done: false,
        },
        activity: [
          ...(x.activity || []),
          {
            on: TODAY,
            text: "Admin follow-up reminder sent. Immediate action required!",
          },
        ],
      }));

      // Deduplicate state notifications as well
      const cleanNotifications = (state.notifications || []).filter(
        (n) => String(n.leadId) !== leadIdStr && String(n.id) !== notifId,
      );

      return {
        ...s,
        leads: (state.leads || []).map((l) =>
          String(l.id) === leadIdStr
            ? {
                ...l,
                adminReminded: true,
                adminRemindedAt: new Date().toISOString(),
                adminRemindNote: "Immediate action required!",
                followUpDate: l.followUpDate || action.followUpDate || TODAY,
              }
            : l,
        ),
        notifications: [newNotif, ...cleanNotifications],
      };
    }
    case "bdeCompleteFollowUp": {
      if (!a?.followUp || a.followUp.done) return state;
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const remindedLeads = JSON.parse(
            localStorage.getItem("leadgen_admin_reminded_leads") || "{}",
          );
          delete remindedLeads[String(action.leadId)];
          localStorage.setItem(
            "leadgen_admin_reminded_leads",
            JSON.stringify(remindedLeads),
          );
        }
      } catch (_e) {}
      const s = touch(state, a.leadId, a.bde, (x) => ({
        ...x,
        adminReminded: false,
        followUp: { ...x.followUp, done: true, doneOn: TODAY },
        activity: [
          ...x.activity,
          {
            on: TODAY,
            text: `Follow-up completed${action.note?.trim() ? `: ${action.note.trim()}` : ""}`,
          },
        ],
      }));
      return {
        ...s,
        leads: (state.leads || []).map((l) =>
          String(l.id) === String(action.leadId)
            ? {
                ...l,
                followUpDone: true,
                followUpDate: undefined,
              }
            : l,
        ),
      };
    }
    case "bdeRequestCredits": {
      if (
        !Number.isInteger(action.amount) ||
        action.amount <= 0 ||
        !action.reason?.trim()
      )
        return state;
      return {
        ...state,
        creditLog: [
          {
            on: currentDate(),
            bde: action.bde,
            kind: "Requested",
            amount: action.amount,
            note: action.reason.trim(),
          },
          ...(state.creditLog ?? []),
        ],
      };
    }
    default:
      return state;
  }
}

export function followUpBucket(f) {
  if (!f) return null;
  if (f.done) return "done";
  if (f.on < TODAY) return "overdue";
  if (f.on === TODAY) return "today";
  return "upcoming";
}

export function selectBdeKpis(state, bde) {
  const bdeLower = (bde || "").toLowerCase();
  const mine = (state?.assignments ?? []).filter(
    (a) => a.bde?.toLowerCase() === bdeLower,
  );
  const row = (state?.bdes ?? []).find(
    (b) => b.name?.toLowerCase() === bdeLower,
  ) ?? {
    allocated: 500,
    used: 0,
  };

  let localUnlockedCount = 0;
  try {
    if (typeof window !== "undefined") {
      const bdeSpecific = JSON.parse(
        localStorage.getItem(`leadgen_unlocked_leads_${bdeLower}`) || "null",
      );
      if (Array.isArray(bdeSpecific)) {
        localUnlockedCount = bdeSpecific.length;
      }
    }
  } catch {}

  const usedCredits = Math.max(row.used || 0, localUnlockedCount);
  const allocatedCredits = row.allocated || 500;

  const count = (fn) => mine.filter(fn).length;
  return {
    assigned: mine.length,
    fresh: count((a) => normalizeStage(a.stage) === "New"),
    unlocked: Math.max(count((a) => a.unlocked), localUnlockedCount),
    connected: count((a) => isConnected(a.stage)),
    interested: count((a) => isInterested(a.stage)),
    converted: count((a) => normalizeStage(a.stage) === "Converted"),
    overdue: count((a) => followUpBucket(a.followUp) === "overdue"),
    today: count((a) => followUpBucket(a.followUp) === "today"),
    upcoming: count((a) => followUpBucket(a.followUp) === "upcoming"),
    allocated: allocatedCredits,
    used: usedCredits,
    available: Math.max(0, allocatedCredits - usedCredits),
  };
}
