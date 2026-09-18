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
  return new Request("http://localhost/api/applications/app-1/status", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const params = { params: Promise.resolve({ id: "app-1" }) };

describe("POST /api/applications/[id]/status", () => {
  beforeEach(() => {
    createClientMock.mockReset();
    createServiceClientMock.mockReset();
  });

  it("updates the status and does not insert a note event when no note is provided", async () => {
    createClientMock.mockResolvedValue(
      fakeAuthedClient({
        userId: "user-1",
        from: () => fakeQueryResult({ id: "app-1", status: "applied" }),
      })
    );

    const applicationsBuilder = fakeQueryResult(null);
    const eventsBuilder = fakeQueryResult(null);
    createServiceClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "applications") return applicationsBuilder;
        if (table === "application_status_events") return eventsBuilder;
        return fakeQueryResult(null);
      }),
    });

    const { POST } = await import("@/app/api/applications/[id]/status/route");
    const response = await POST(jsonRequest({ status: "employer_response" }), params);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(applicationsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "employer_response" })
    );
    expect(eventsBuilder.insert).not.toHaveBeenCalled();
  });

  it("records a note event with the from/to status transition when a note is provided", async () => {
    createClientMock.mockResolvedValue(
      fakeAuthedClient({
        userId: "user-1",
        from: () => fakeQueryResult({ id: "app-1", status: "applied" }),
      })
    );

    const applicationsBuilder = fakeQueryResult(null);
    const eventsBuilder = fakeQueryResult(null);
    createServiceClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "applications") return applicationsBuilder;
        if (table === "application_status_events") return eventsBuilder;
        return fakeQueryResult(null);
      }),
    });

    const { POST } = await import("@/app/api/applications/[id]/status/route");
    const response = await POST(
      jsonRequest({ status: "rejected", note: "Recruiter called to say the role was filled." }),
      params
    );

    expect(response.status).toBe(200);
    expect(eventsBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        application_id: "app-1",
        user_id: "user-1",
        from_status: "applied",
        to_status: "rejected",
        source: "user",
        detail: "Recruiter called to say the role was filled.",
      })
    );
  });

  it("rejects an invalid status value before touching the database", async () => {
    createClientMock.mockResolvedValue(fakeAuthedClient({ userId: "user-1" }));
    createServiceClientMock.mockReturnValue(fakeAuthedClient({ userId: "service" }));

    const { POST } = await import("@/app/api/applications/[id]/status/route");
    const response = await POST(jsonRequest({ status: "not-a-real-status" }), params);
    expect(response.status).toBe(400);
  });

  it("returns 404 when the application does not belong to the authenticated user", async () => {
    createClientMock.mockResolvedValue(
      fakeAuthedClient({ userId: "user-1", from: () => fakeQueryResult(null) })
    );
    createServiceClientMock.mockReturnValue(fakeAuthedClient({ userId: "service" }));

    const { POST } = await import("@/app/api/applications/[id]/status/route");
    const response = await POST(jsonRequest({ status: "applied" }), params);
    expect(response.status).toBe(404);
  });
});
