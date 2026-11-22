import React from "react";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "@/App";
import { LeadGenProvider } from "@/lib/leadgen/store";

describe("Frontend Modules, Components & Actions Audit", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // 1. Master Admin Area Routes
  describe("Master Admin Workspace", () => {
    beforeEach(() => {
      localStorage.setItem("token", "admin-test-token");
      localStorage.setItem(
        "user",
        JSON.stringify({ role: "admin", name: "Sriram", email: "sriram@leadgen.pro" })
      );
    });

    it("renders Master Admin Dashboard (/) without crash", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
      expect(screen.getByText("Total Leads")).toBeInTheDocument();
      expect(screen.getByText("Pending Review")).toBeInTheDocument();
      expect(screen.getByText("Approved Leads")).toBeInTheDocument();
    });

    it("renders Leads Review (/leads-review) with review actions", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/leads-review"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders Lead Allocation (/lead-allocation) with allocation controls", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/lead-allocation"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders BDE Credit Management (/credits) with quota tables", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/credits"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders Research Analysts overview (/research-analysts)", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/research-analysts"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders Team Management (/team) with member directory", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/team"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders Operations (/operations) dashboard", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/operations"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders Reports & Analytics (/reports) with KPI cards & category filter", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/reports"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders Settings (/settings) with tab navigation", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/settings"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });
  });

  // 2. Research Analyst (RA) Area Routes
  describe("Research Analyst Workspace", () => {
    beforeEach(() => {
      localStorage.setItem("token", "ra-test-token");
      localStorage.setItem(
        "user",
        JSON.stringify({ role: "ra", name: "Priya M", email: "priya.m@leadgen.pro" })
      );
    });

    it("renders RA Dashboard (/ra) successfully", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/ra"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders RA Upload (/ra/upload)", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/ra/upload"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders RA Uploads history (/ra/uploads)", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/ra/uploads"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders RA Approval Status (/ra/status)", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/ra/status"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders RA Approved leads (/ra/approved)", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/ra/approved"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders RA Rejected leads with correction controls (/ra/rejected)", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/ra/rejected"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders RA Performance reports (/ra/reports)", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/ra/reports"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });
  });

  // 3. Admissions BDE Area Routes
  describe("Admissions BDE Workspace", () => {
    beforeEach(() => {
      localStorage.setItem("token", "bde-test-token");
      localStorage.setItem(
        "user",
        JSON.stringify({ role: "bde", name: "Ravi Kumar", email: "ravi.kumar@leadgen.pro" })
      );
    });

    it("renders BDE Dashboard (/bde)", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/bde"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders BDE Leads (/bde/leads) with unlock button controls", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/bde/leads"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders BDE Follow-ups (/bde/follow-ups)", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/bde/follow-ups"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("renders BDE Credits (/bde/credits) with top-up request modal", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/bde/credits"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });
  });

  // 4. Login Experience & Enterprise Authentication
  describe("Login Experience & Enterprise Authentication", () => {
    it("renders /login with clean enterprise form and Sign In button", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/login"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );

      expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
      expect(screen.getByLabelText(/Work Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();

      // Verify no legacy brand words are rendered
      expect(screen.queryByText("Arah")).not.toBeInTheDocument();
      expect(screen.queryByText("Arah Infotech")).not.toBeInTheDocument();
    });

    it("populates Research Analyst credentials via Demo Credentials helper", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/login"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );

      // Open the subtle demo credentials modal
      const demoHelperBtn = screen.getByText("Demo Credentials");
      fireEvent.click(demoHelperBtn);

      // Select Research Analyst
      const raCard = screen.getByText(/Research Analyst \(Priya M\)/i);
      fireEvent.click(raCard);

      const emailInput = screen.getByLabelText(/Work Email Address/i);
      expect(emailInput.value).toBe("priya.m@leadgen.pro");
    });

    it("populates Admissions BDE credentials via Demo Credentials helper", () => {
      render(
        <LeadGenProvider>
          <MemoryRouter initialEntries={["/login"]}>
            <AppRoutes />
          </MemoryRouter>
        </LeadGenProvider>
      );

      // Open the subtle demo credentials modal
      const demoHelperBtn = screen.getByText("Demo Credentials");
      fireEvent.click(demoHelperBtn);

      // Select Admissions BDE
      const bdeCard = screen.getByText(/Admissions BDE \(Ravi Kumar\)/i);
      fireEvent.click(bdeCard);

      const emailInput = screen.getByLabelText(/Work Email Address/i);
      expect(emailInput.value).toBe("ravi.kumar@leadgen.pro");
    });
  });
});
