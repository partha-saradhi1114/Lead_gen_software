import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "@/App";
import { LeadGenProvider } from "@/lib/leadgen/store";

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
});
