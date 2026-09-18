import { describe, expect, it } from "vitest";
import { decideField, type ApplyContext } from "@/lib/apply/field-rules";

function context(overrides: Partial<ApplyContext> = {}): ApplyContext {
  return {
    profile: { full_name: "Ada Lovelace", location: "London, UK" },
    preferences: null,
    vault: [],
    email: "ada@example.com",
    ...overrides,
  };
}

describe("decideField", () => {
  it("pauses for sensitive demographic questions regardless of vault contents", () => {
    const decision = decideField("What is your race or ethnicity?", "text", context());
    expect(decision).toEqual({
      action: "pause",
      category: "sensitive",
      reason: expect.stringContaining("Sensitive"),
    });
  });

  it("pauses for password fields", () => {
    const decision = decideField("Account password", "password", context());
    expect(decision.action).toBe("pause");
  });

  it("pauses for CAPTCHA/verification-code style questions even for text inputs", () => {
    const decision = decideField("Enter the verification code we texted you", "text", context());
    expect(decision.action).toBe("pause");
  });

  it("prefers an auto-use-allowed vault answer over a generic profile fallback", () => {
    const ctx = context({
      vault: [
        {
          answer_key: "work_authorization_us",
          label: "Are you authorized to work in the US?",
          category: "work_authorization",
          answer_text: "Yes, I am a US citizen.",
          auto_use_allowed: true,
        },
      ],
    });

    const decision = decideField("Are you authorized to work in the US?", "text", ctx);
    expect(decision).toMatchObject({
      action: "fill",
      source: "vault",
      value: "Yes, I am a US citizen.",
    });
  });

  it("does not use a vault answer that is not marked auto_use_allowed", () => {
    const ctx = context({
      vault: [
        {
          answer_key: "salary_expectation",
          label: "Salary expectation",
          category: "salary",
          answer_text: "$150,000",
          auto_use_allowed: false,
        },
      ],
    });

    const decision = decideField("Salary expectation", "text", ctx);
    expect(decision.action).not.toBe("fill");
  });

  it("fills first and last name by splitting the verified profile full name", () => {
    const ctx = context();
    expect(decideField("First Name", "text", ctx)).toMatchObject({
      action: "fill",
      value: "Ada",
      source: "profile",
    });
    expect(decideField("Last Name", "text", ctx)).toMatchObject({
      action: "fill",
      value: "Lovelace",
      source: "profile",
    });
  });

  it("fills email from the verified account email", () => {
    const decision = decideField("Email address", "email", context());
    expect(decision).toMatchObject({ action: "fill", value: "ada@example.com" });
  });

  it("fills work authorization only from explicit candidate preferences", () => {
    const withPref = decideField(
      "Are you legally authorized to work in this country?",
      "text",
      context({ preferences: { work_authorization: "US Citizen" } })
    );
    expect(withPref).toMatchObject({ action: "fill", value: "US Citizen" });

    const withoutPref = decideField(
      "Are you legally authorized to work in this country?",
      "text",
      context({ preferences: null })
    );
    expect(withoutPref.action).toBe("pause");
  });

  it("never fabricates a phone number; always pauses for user input", () => {
    const decision = decideField("Mobile phone", "tel", context());
    expect(decision).toEqual({
      action: "pause",
      category: "contact",
      reason: expect.any(String),
    });
  });

  it("pauses on unknown questions instead of guessing an answer", () => {
    const decision = decideField(
      "Describe a time you disagreed with a manager",
      "textarea",
      context()
    );
    expect(decision).toEqual({
      action: "pause",
      category: "custom",
      reason: expect.any(String),
    });
  });
});
