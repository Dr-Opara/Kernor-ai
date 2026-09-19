import { describe, expect, it, vi, beforeEach } from "vitest";
import { fakeAuthedClient, fakeQueryResult } from "../helpers/fake-supabase";

const createClientMock = vi.fn();
const createServiceClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => createServiceClientMock(),
}));

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/follow-ups/draft-1", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const params = { params: Promise.resolve({ id: "draft-1" }) };
const validBody = {
  recipientEmail: "interviewer@example.com",
  recipientName: "Jordan Interviewer",
  subject: "Thank you for the conversation",
  body: "Thank you for taking the time to speak with me about the role today.",
};

describe("POST /api/follow-ups/[id]", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    createServiceClientMock.mockReset();
  });

  it("saves edits to a draft that has not been sent yet", async () => {
    createClientMock.mockResolvedValue(
      fakeAuthedClient({
        userId: "user-1",
        from: () => fakeQueryResult({ id: "draft-1", status: "draft" }),
      })
    );

    const draftsBuilder = fakeQueryResult(null);
    createServiceClientMock.mockReturnValue({
      from: vi.fn(() => draftsBuilder),
    });

    const { POST } = await import("@/app/api/follow-ups/[id]/route");
    const response = await POST(jsonRequest(validBody), params);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(draftsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_email: "interviewer@example.com",
        subject: validBody.subject,
        status: "draft",
      })
    );
  });

  it("refuses to edit a draft that has already been sent", async () => {
    createClientMock.mockResolvedValue(
      fakeAuthedClient({
        userId: "user-1",
        from: () => fakeQueryResult({ id: "draft-1", status: "sent" }),
      })
    );
    createServiceClientMock.mockReturnValue(fakeAuthedClient({ userId: "service" }));

    const { POST } = await import("@/app/api/follow-ups/[id]/route");
    const response = await POST(jsonRequest(validBody), params);
    expect(response.status).toBe(409);
  });

  it("rejects a malformed recipient email before any database write", async () => {
    createClientMock.mockResolvedValue(fakeAuthedClient({ userId: "user-1" }));
    const serviceFrom = vi.fn();
    createServiceClientMock.mockReturnValue({ from: serviceFrom });

    const { POST } = await import("@/app/api/follow-ups/[id]/route");
    const response = await POST(
      jsonRequest({ ...validBody, recipientEmail: "not-an-email" }),
      params
    );

    expect(response.status).toBe(400);
    expect(serviceFrom).not.toHaveBeenCalled();
  });

  it("requires outbound-send authorization to be a separate approval step (status can move to approved, not sent, from this endpoint)", async () => {
    createClientMock.mockResolvedValue(
      fakeAuthedClient({
        userId: "user-1",
        from: () => fakeQueryResult({ id: "draft-1", status: "draft" }),
      })
    );
    const draftsBuilder = fakeQueryResult(null);
    createServiceClientMock.mockReturnValue({ from: vi.fn(() => draftsBuilder) });

    const { POST } = await import("@/app/api/follow-ups/[id]/route");
    await POST(jsonRequest({ ...validBody, status: "approved" }), params);

    expect(draftsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" })
    );
    // The schema only allows "draft" | "approved" from this endpoint —
    // sending is a separate, explicit action (see send/route.ts).
  });
});
