import { describe, expect, it } from "vitest";
import {
  detectMeetingProvider,
  extractMeetingUrl,
  heuristicSignalType,
  matchApplication,
  statusForSignal,
  type TrackedApplication,
} from "@/lib/integrations/google-detection";

describe("heuristicSignalType", () => {
  it("classifies an offer letter", () => {
    expect(
      heuristicSignalType("We are pleased to offer you the position of Software Engineer.")
    ).toBe("offer");
  });

  it("classifies a rejection", () => {
    expect(
      heuristicSignalType("Unfortunately, we have decided to move forward with other candidates.")
    ).toBe("rejection");
  });

  it("classifies an interview invitation", () => {
    expect(
      heuristicSignalType("We would like to schedule a phone screen with you next week.")
    ).toBe("interview_invite");
  });

  it("classifies a take-home assessment", () => {
    expect(
      heuristicSignalType("Please complete the attached take home coding challenge by Friday.")
    ).toBe("assessment");
  });

  it("classifies a generic recruiter follow-up as an employer response", () => {
    expect(
      heuristicSignalType("Thanks for applying — our hiring team is reviewing your application.")
    ).toBe("employer_response");
  });

  it("falls back to unknown rather than guessing", () => {
    expect(heuristicSignalType("Your Amazon package has shipped.")).toBe("unknown");
  });

  it("prioritizes an offer classification even when rejection-adjacent words appear elsewhere", () => {
    expect(
      heuristicSignalType(
        "We know you interviewed with other candidates too, but we are pleased to offer you the role."
      )
    ).toBe("offer");
  });
});

describe("statusForSignal", () => {
  it("maps every non-unknown signal type to a pipeline status", () => {
    expect(statusForSignal("assessment")).toBe("assessment");
    expect(statusForSignal("interview_invite")).toBe("interview");
    expect(statusForSignal("interview_update")).toBe("interview");
    expect(statusForSignal("rejection")).toBe("rejected");
    expect(statusForSignal("offer")).toBe("offer");
    expect(statusForSignal("employer_response")).toBe("employer_response");
  });

  it("returns null for unknown signals so an ambiguous message cannot silently move an application", () => {
    expect(statusForSignal("unknown")).toBeNull();
  });
});

describe("matchApplication", () => {
  const applications: TrackedApplication[] = [
    { id: "app-1", company_name: "Acme Corp", role_title: "Senior Backend Engineer", status: "applied" },
    { id: "app-2", company_name: "Globex", role_title: "Product Manager", status: "applied" },
  ];

  it("matches on a strong company name signal", () => {
    const result = matchApplication(
      "Thank you for applying to Acme Corp. We'll be in touch about the Backend Engineer role.",
      applications
    );
    expect(result?.id).toBe("app-1");
  });

  it("does not match when neither company nor role tokens are present", () => {
    const result = matchApplication(
      "This is an unrelated newsletter about market trends.",
      applications
    );
    expect(result).toBeNull();
  });

  it("does not match on generic seniority/role words alone (filtered out as tokens)", () => {
    const result = matchApplication(
      "We are hiring a senior engineer manager for our team.",
      applications
    );
    expect(result).toBeNull();
  });

  it("picks the best-scoring application when multiple are plausible", () => {
    const result = matchApplication(
      "Following up on your application to Globex for the Product Manager role.",
      applications
    );
    expect(result?.id).toBe("app-2");
  });
});

describe("detectMeetingProvider", () => {
  it("detects Google Meet, Zoom, Teams, and Webex from message text", () => {
    expect(detectMeetingProvider("Join at https://meet.google.com/abc-defg-hij")).toBe(
      "Google Meet"
    );
    expect(detectMeetingProvider("https://zoom.us/j/123456789")).toBe("Zoom");
    expect(detectMeetingProvider("Join via Microsoft Teams")).toBe("Microsoft Teams");
    expect(detectMeetingProvider("https://company.webex.com/meet/room")).toBe("Webex");
  });

  it("returns null when no known provider is mentioned", () => {
    expect(detectMeetingProvider("We will call your phone number instead.")).toBeNull();
  });
});

describe("extractMeetingUrl", () => {
  it("extracts a known meeting URL from surrounding text", () => {
    const url = extractMeetingUrl(
      "Please join us here: https://meet.google.com/abc-defg-hij for the interview."
    );
    expect(url).toBe("https://meet.google.com/abc-defg-hij");
  });

  it("ignores unrelated links and returns null", () => {
    const url = extractMeetingUrl("See our careers page at https://example.com/careers");
    expect(url).toBeNull();
  });
});
