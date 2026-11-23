import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App, { AppRoutes } from "@/App";
import { LeadGenProvider } from "@/lib/leadgen/store";
import { fmt } from "@/lib/leadgen/data";

describe("App routing", () => {
  it("renders the Master Admin dashboard for / instead of 404", () => {
    render(
      <LeadGenProvider>
        <MemoryRouter initialEntries={["/"]}>
          <AppRoutes />
        </MemoryRouter>
      </LeadGenProvider>,
    );

    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });

  it("renders 404 page for unmatched routes", () => {
    render(
      <LeadGenProvider>
        <MemoryRouter initialEntries={["/non-existent-route"]}>
          <AppRoutes />
        </MemoryRouter>
      </LeadGenProvider>,
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("renders /ra when authenticated", () => {
    localStorage.setItem("token", "dummy-token");
    localStorage.setItem(
      "user",
      JSON.stringify({ role: "ra", name: "Priya M" }),
    );
    render(
      <LeadGenProvider>
        <MemoryRouter initialEntries={["/ra"]}>
          <AppRoutes />
        </MemoryRouter>
      </LeadGenProvider>,
    );
  });

  it("renders <App /> directly at /ra", () => {
    localStorage.setItem("token", "dummy-token");
    localStorage.setItem(
      "user",
      JSON.stringify({ role: "ra", name: "Priya M" }),
    );
    window.history.pushState({}, "", "/ra");
    render(<App />);
  });

  it("safely formats numbers with fmt without throwing on undefined or null", () => {
    expect(fmt(undefined)).toBe("0");
    expect(fmt(null)).toBe("0");
    expect(fmt(NaN)).toBe("0");
    expect(fmt(0)).toBe("0");
    expect(fmt(1234)).toBe("1,234");
    expect(fmt("5000")).toBe("5,000");
  });

  it("displays custom logged-in user name 'SAI' in the top right header", () => {
    localStorage.setItem("token", "dummy-token-sai");
    localStorage.setItem(
      "user",
      JSON.stringify({ role: "ra", name: "SAI", email: "sai@gmail.com", phone: "+91 98765 43210" }),
    );
    window.history.pushState({}, "", "/ra");
    render(<App />);
    expect(screen.getAllByText("SAI").length).toBeGreaterThan(0);
    expect(screen.queryByText("Welcome back, Priya M")).not.toBeInTheDocument();
  });
});
