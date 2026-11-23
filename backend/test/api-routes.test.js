import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/server.js";

let server;
let BASE_URL = "";
let adminToken = "";
let raToken = "";
let bdeToken = "";
let sampleLeadId = "";

describe("Complete API Routes & Frontend Integration Verification", () => {
  before(async () => {
    server = app.listen(5006);
    await new Promise((resolve) => server.once("listening", resolve));
    BASE_URL = `http://127.0.0.1:5006/api`;
  });

  after(async () => {
    if (server && server.close) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // 1. Healthcheck
  it("GET /api/health -> returns 200 with status ok", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "ok");
    assert.ok(data.timestamp);
  });

  // 2. Authentication: Admin Login
  it("POST /api/auth/login (Admin) -> returns 200 with JWT and user object", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "sriram@leadgen.pro",
        password: "Password@123",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.token);
    assert.equal(data.user.role, "admin");
    adminToken = data.token;
  });

  // 3. Authentication: Research Analyst Login
  it("POST /api/auth/login (Research Analyst) -> returns 200 with RA token", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "priya.m@leadgen.pro",
        password: "Password@123",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.token);
    assert.equal(data.user.role, "ra");
    raToken = data.token;
  });

  // 4. Authentication: Admissions BDE Login
  it("POST /api/auth/login (BDE) -> returns 200 with BDE token", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "ravi.kumar@leadgen.pro",
        password: "Password@123",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.token);
    assert.equal(data.user.role, "bde");
    bdeToken = data.token;
  });

  // 5. Authentication: Invalid Login
  it("POST /api/auth/login (Invalid password) -> returns 401", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "sriram@leadgen.pro",
        password: "WrongPassword!",
      }),
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  // 6. Current User Profile: GET /api/auth/me
  it("GET /api/auth/me (Protected with Admin token) -> returns 200 and user info", async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.user);
    assert.equal(data.user.role, "admin");
  });

  // 7. Role-based Admin Users: GET /api/auth/users
  it("GET /api/auth/users (Admin role) -> returns 200 and user directory", async () => {
    const res = await fetch(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.users));
    assert.ok(data.users.length > 0);
  });

  // 8. Role-based Admin Users: Forbidden for RA
  it("GET /api/auth/users (Non-Admin RA role) -> returns 403 Forbidden", async () => {
    const res = await fetch(`${BASE_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${raToken}` },
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  // 9. Full Initial State (Hydration endpoint for frontend)
  it("GET /api/leads/full-state -> returns 200 with full ecosystem state", async () => {
    const res = await fetch(`${BASE_URL}/leads/full-state`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.leads));
    assert.ok(data.leads.length > 0);
    assert.ok(Array.isArray(data.batches));
    assert.ok(Array.isArray(data.bdes));
    assert.ok(Array.isArray(data.team));
    assert.ok(data.credits);
    assert.ok(data.settings);
    sampleLeadId = data.leads[0].id;
  });

  // 10. Filtered Leads Query: All leads
  it("GET /api/leads -> returns 200 with paginated leads and total count", async () => {
    const res = await fetch(`${BASE_URL}/leads?limit=10&offset=0`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(typeof data.total === "number");
    assert.ok(Array.isArray(data.leads));
    assert.equal(data.leads.length, 10);
  });

  // 11. Filtered Leads Query: Status Filter
  it("GET /api/leads?status=approved -> returns 200 with approved leads only", async () => {
    const res = await fetch(`${BASE_URL}/leads?status=approved&limit=5`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.leads));
    for (const lead of data.leads) {
      assert.equal(lead.status, "approved");
    }
  });

  // 12. Filtered Leads Query: Category Filter
  it("GET /api/leads?category=Students / Education -> returns 200 with matching category", async () => {
    const res = await fetch(
      `${BASE_URL}/leads?category=${encodeURIComponent("Students / Education")}&limit=5`
    );
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.leads));
    for (const lead of data.leads) {
      assert.equal(lead.category, "Students / Education");
    }
  });

  // 13. Batches History
  it("GET /api/leads/batches -> returns 200 with batch upload list", async () => {
    const res = await fetch(`${BASE_URL}/leads/batches`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });

  // 14. BDE Credits Overview
  it("GET /api/leads/credits -> returns 200 with BDE credit allocations", async () => {
    const res = await fetch(`${BASE_URL}/leads/credits`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data && typeof data.allocated === "number");
    assert.ok(Array.isArray(data.bdes));
    assert.ok(data.bdes.length > 0);
  });

  // 15. Single Lead Detail: Existing ID
  it("GET /api/leads/:id -> returns 200 with lead details", async () => {
    assert.ok(sampleLeadId, "Sample lead id must be available");
    const res = await fetch(`${BASE_URL}/leads/${sampleLeadId}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.id, sampleLeadId);
    assert.ok(data.company);
  });

  // 16. Single Lead Detail: Not Found
  it("GET /api/leads/non-existent-id -> returns 404", async () => {
    const res = await fetch(`${BASE_URL}/leads/non-existent-lead-xyz-99999`);
    assert.equal(res.status, 404);
  });

  // 17. Approve Leads
  it("POST /api/leads/approve -> returns 200 and marks leads approved", async () => {
    const fetchRes = await fetch(`${BASE_URL}/leads?status=pending&limit=2`);
    const { leads } = await fetchRes.json();
    assert.ok(leads.length > 0, "Need pending lead to test approve");

    const ids = leads.map((l) => l.id);
    const res = await fetch(`${BASE_URL}/leads/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.message.includes("approved successfully"));
  });

  // 18. Reject Leads
  it("POST /api/leads/reject -> returns 200 and records rejection reason", async () => {
    const fetchRes = await fetch(`${BASE_URL}/leads?status=pending&limit=1`);
    const { leads } = await fetchRes.json();
    assert.ok(leads.length > 0, "Need pending lead to test reject");

    const id = leads[0].id;
    const res = await fetch(`${BASE_URL}/leads/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: [id],
        reason: "Contact phone unverified during audit",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.message.includes("rejected successfully"));
  });

  // 19. Allocate Credits
  it("POST /api/leads/allocate -> returns 200 and allocates credits to BDE", async () => {
    const res = await fetch(`${BASE_URL}/leads/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bde: "Ravi Kumar",
        amount: 50,
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.message.includes("allocated successfully"));
  });

  // 20. Assign Leads
  it("POST /api/leads/assign -> returns 200 and assigns leads to BDE", async () => {
    const fetchRes = await fetch(`${BASE_URL}/leads?status=approved&limit=2`);
    const { leads } = await fetchRes.json();
    assert.ok(leads.length > 0, "Need approved leads to assign");

    const leadIds = leads.map((l) => l.id);
    const res = await fetch(`${BASE_URL}/leads/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadIds,
        bde: "Ravi Kumar",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.message.includes("assigned successfully"));
  });

  // 21. Upload Batch (Research Analyst pipeline)
  it("POST /api/leads/upload -> returns 201 Created and ingests batch records", async () => {
    const testBatchId = `TEST-BATCH-${Date.now()}`;
    const res = await fetch(`${BASE_URL}/leads/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batch: {
          id: testBatchId,
          fileName: "Hyderabad_University_Engineering_2026.xlsx",
          uploadedBy: "Priya M",
          category: "Students / Education",
        },
        rows: [
          {
            company: "CBIT Engineering College",
            contact: "Dr. K. Srinivas Rao",
            email: "principal@cbit.ac.in",
            phone: "+91 94401 22334",
            stateCity: "Hyderabad, Telangana",
            category: "Students / Education",
          },
          {
            company: "Vasavi College of Engineering",
            contact: "Prof. Sudhakar Reddy",
            email: "admissions@vce.ac.in",
            phone: "+91 98480 33445",
            stateCity: "Hyderabad, Telangana",
            category: "Students / Education",
          },
        ],
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.message.includes("uploaded successfully"));
  });

  // 22. Unlock Lead Contact (BDE Action)
  it("POST /api/leads/:id/unlock -> returns 200 and marks lead unlocked", async () => {
    assert.ok(sampleLeadId);
    const res = await fetch(`${BASE_URL}/leads/${sampleLeadId}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bde: "Ravi Kumar" }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.message.includes("unlocked successfully"));
    assert.ok(data.lead.unlockedBy.includes("Ravi Kumar"));
  });

  // 23. Update Lead Stage & Disposition
  it("PATCH /api/leads/:id -> returns 200 and updates stage and notes", async () => {
    assert.ok(sampleLeadId);
    const res = await fetch(`${BASE_URL}/leads/${sampleLeadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: "interested",
        notes: "Campus placement coordinator requested corporate presentation",
        followUpDate: "2026-11-28",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.lead.stage, "interested");
  });

  // 24. Credit Request (BDE requests topup)
  it("POST /api/leads/credits/request -> returns 200 and logs topup request", async () => {
    const res = await fetch(`${BASE_URL}/leads/credits/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bde: "Ravi Kumar",
        amount: 250,
        reason: "Quarterly college admissions outreach sprint",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.message.includes("Credit request submitted"));
    assert.equal(data.request.amount, 250);
  });

  // 25. Settings GET & POST
  it("GET /api/settings -> returns 200 with platform settings", async () => {
    const res = await fetch(`${BASE_URL}/settings`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.general);
    assert.ok(data.credits);
  });

  it("POST /api/settings -> returns 200 and persists settings section updates", async () => {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: "credits",
        values: { costPerUnlock: 12, defaultMonthlyQuota: 600 },
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.settings.credits.costPerUnlock, 12);
  });

  // 26. Team Management
  it("GET /api/team -> returns 200 with team directory", async () => {
    const res = await fetch(`${BASE_URL}/team`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
  });

  it("POST /api/team -> returns 201 Created and adds new team member", async () => {
    const res = await fetch(`${BASE_URL}/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Vikram Seth",
        email: "vikram.seth@leadgen.pro",
        role: "BDE",
        phone: "+91 98888 12345",
        department: "Enterprise Admissions",
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.message.includes("Team member added successfully"));
    assert.equal(data.member.name, "Vikram Seth");
  });

  it("GET /api/team/bdes -> returns 200 with BDE quota listing", async () => {
    const res = await fetch(`${BASE_URL}/team/bdes`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });

  // 27. Analytics & KPIs
  it("GET /api/stats/kpis -> returns 200 with accurate platform KPIs", async () => {
    const res = await fetch(`${BASE_URL}/stats/kpis`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(typeof data.total === "number");
    assert.ok(typeof data.approved === "number");
    assert.ok(typeof data.rejected === "number");
    assert.ok(typeof data.pending === "number");
    assert.ok(typeof data.creditsAllocated === "number");
    assert.ok(typeof data.creditsUsed === "number");
  });
});
