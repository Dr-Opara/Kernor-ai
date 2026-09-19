import { describe, expect, it } from "vitest";
import { billingCatalog } from "@/lib/billing/catalog";

describe("billingCatalog", () => {
  it("prices one application credit at exactly $0.99", () => {
    expect(billingCatalog.app_1.amountCents).toBe(99);
    expect(billingCatalog.app_1.creditType).toBe("application");
    expect(billingCatalog.app_1.creditDelta).toBe(1);
  });

  it("prices one interview pass at exactly $24.99", () => {
    expect(billingCatalog.interview_1.amountCents).toBe(2499);
    expect(billingCatalog.interview_1.creditType).toBe("interview");
    expect(billingCatalog.interview_1.creditDelta).toBe(1);
  });

  it("exposes no other SKUs (no bundle tiers, no subscription)", () => {
    expect(Object.keys(billingCatalog).sort()).toEqual(["app_1", "interview_1"]);
  });
});
