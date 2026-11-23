import { describe, expect, it } from "vitest";
import { getNotificationsForUser, CURRENT_RA } from "./data";
import { CURRENT_BDE } from "./bde";

describe("Role-based notifications scoping", () => {
  it("delivers supervisory cross-team notifications to Master Admin", () => {
    const adminNotifs = getNotificationsForUser("admin", "Sriram");
    expect(adminNotifs.length).toBeGreaterThan(0);
    expect(adminNotifs.every((n) => n.role === "admin")).toBe(true);

    // Master sees notifications about multiple team members
    const text = adminNotifs.map((n) => n.title).join(" ");
    expect(text).toContain("Priya M");
    expect(text).toContain("Ravi Kumar");
    expect(text).toContain("Anitha Reddy");
  });

  it("delivers RA-specific notifications to Research Analyst Priya M", () => {
    const raNotifs = getNotificationsForUser("ra", CURRENT_RA);
    expect(raNotifs.length).toBeGreaterThan(0);
    expect(raNotifs.every((n) => n.role === "ra")).toBe(true);

    // RA should only see batch approvals, rejections, and research assignments
    const text = raNotifs.map((n) => n.title).join(" ");
    expect(text).toContain("approved");
    expect(text).toContain("rejected");
    expect(text).not.toContain("credits remaining");
    expect(text).not.toContain("follow-up calls are overdue");
  });

  it("delivers BDE-specific notifications to BDE Ravi Kumar", () => {
    const bdeNotifs = getNotificationsForUser("bde", CURRENT_BDE);
    expect(bdeNotifs.length).toBeGreaterThan(0);
    expect(bdeNotifs.every((n) => n.role === "bde")).toBe(true);

    // BDE should only see allocated leads, follow-ups, and credit alerts
    const text = bdeNotifs.map((n) => n.title).join(" ");
    expect(text).toContain("leads allocated");
    expect(text).toContain("follow-up");
    expect(text).toContain("Credit Alert");
    expect(text).not.toContain("leads uploaded by");
    expect(text).not.toContain("leads rejected from Batch");
  });

  it("filters persona-specific alerts between different BDEs", () => {
    const raviNotifs = getNotificationsForUser("bde", "Ravi Kumar");
    const anithaNotifs = getNotificationsForUser("bde", "Anitha Reddy");

    expect(raviNotifs.some((n) => n.title.includes("84% credits used"))).toBe(true);
    expect(anithaNotifs.some((n) => n.title.includes("100 bonus credits"))).toBe(true);
    expect(anithaNotifs.some((n) => n.title.includes("84% credits used"))).toBe(false);
  });
});
