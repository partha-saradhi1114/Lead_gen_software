function getBaseUrl() {
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.origin &&
    window.location.origin !== "null"
  ) {
    return "/api";
  }
  return "http://localhost:5000/api";
}

async function request(path, options = {}) {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${getBaseUrl()}${path}`;
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    // Only warn when not running inside automated test environments to keep test logs pristine
    if (
      typeof window === "undefined" ||
      (typeof process !== "undefined" && process.env?.NODE_ENV === "test")
    ) {
      // Graceful fallback for test runner
    } else {
      console.warn(`[API] ${path} request note:`, error.message);
    }
    throw error;
  }
}

export const api = {
  // Auth
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request("/auth/me"),

  // System
  checkHealth: () => request("/health"),
  getFullState: () => request("/leads/full-state"),

  // Leads
  getLeads: (query) => {
    const params = new URLSearchParams();
    if (query?.status) params.set("status", query.status);
    if (query?.source) params.set("source", query.source);
    if (query?.category) params.set("category", query.category);
    if (query?.researcher) params.set("researcher", query.researcher);
    if (query?.assignedBde) params.set("assignedBde", query.assignedBde);
    if (query?.search) params.set("search", query.search);
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.offset) params.set("offset", String(query.offset));
    return request(`/leads?${params.toString()}`);
  },
  getLeadById: (id) => request(`/leads/${id}`),
  approveLeads: (ids) =>
    request("/leads/approve", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),
  rejectLeads: (ids, reason) =>
    request("/leads/reject", {
      method: "POST",
      body: JSON.stringify({ ids, reason }),
    }),
  allocateCredits: (bde, amount) =>
    request("/leads/allocate", {
      method: "POST",
      body: JSON.stringify({ bde, amount }),
    }),
  assignLeads: (leadIds, bde) =>
    request("/leads/assign", {
      method: "POST",
      body: JSON.stringify({ leadIds, bde }),
    }),
  uploadBatch: (batch, rows) =>
    request("/leads/upload", {
      method: "POST",
      body: JSON.stringify({ batch, rows }),
    }),
  getTeam: () => request("/team"),
  addTeamMember: (member) =>
    request("/team", {
      method: "POST",
      body: JSON.stringify(member),
    }),
  getBdes: () => request("/team/bdes"),
  getKpis: () => request("/stats/kpis"),

  // BDE Actions
  unlockLead: (id, bde) =>
    request(`/leads/${id}/unlock`, {
      method: "POST",
      body: JSON.stringify({ bde }),
    }),
  updateLead: (id, updates) =>
    request(`/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  requestCredits: (bde, amount, reason) =>
    request("/leads/credits/request", {
      method: "POST",
      body: JSON.stringify({ bde, amount, reason }),
    }),
  getSettings: () => request("/settings"),
  updateSettings: (section, values) =>
    request("/settings", {
      method: "POST",
      body: JSON.stringify({ section, values }),
    }),
};
