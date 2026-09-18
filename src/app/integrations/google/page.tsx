import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getGoogleAccessToken } from "@/lib/integrations/google-auth";
import GoogleSyncButton from "@/components/google-sync-button";

export default async function GoogleIntegrationPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { connected, error } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;

  if (!userId) redirect("/login");

  const service = createServiceClient();

  if (connected === "1") {
    try {
      await getGoogleAccessToken(userId);
      await service.from("integration_connections").upsert({
        user_id: userId,
        provider: "google",
        status: "connected",
        connector_id: process.env.VERCEL_CONNECT_GOOGLE_CONNECTOR || null,
        connected_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      });
    } catch (authError) {
      await service.from("integration_connections").upsert({
        user_id: userId,
        provider: "google",
        status: "error",
        last_error:
          authError instanceof Error
            ? authError.message
            : "Google authorization could not be verified.",
        updated_at: new Date().toISOString(),
      });
    }
  }

  const [{ data: connection }, { count: signalCount }] = await Promise.all([
    supabase
      .from("integration_connections")
      .select("status,last_sync_at,last_error,connected_at")
      .eq("user_id", userId)
      .eq("provider", "google")
      .maybeSingle(),
    supabase
      .from("external_signals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const isConnected = connection?.status === "connected";

  return (
    <main className="shell" style={{ padding: "54px 0 100px" }}>
      <Link href="/profile" className="muted" style={{ fontSize: 14 }}>
        ← Profile
      </Link>

      <div style={{ width: "min(760px,100%)", margin: "56px auto 0" }}>
        <div className="badge">Google integration</div>
        <h1 style={{ fontSize: 46, letterSpacing: "-0.05em", margin: "16px 0 8px" }}>
          Let Kernor watch for the next step.
        </h1>
        <p className="muted" style={{ fontSize: 18, lineHeight: 1.6, margin: 0 }}>
          Connect Gmail and Google Calendar so Kernor can detect recruiter responses,
          assessments, interview invitations, and scheduled interviews.
        </p>

        {error ? <div className="apply-error" style={{ marginTop: 20 }}>{error}</div> : null}

        <div className="card google-connection-card">
          <div>
            <div className="muted" style={{ fontSize: 13 }}>Connection</div>
            <h2 style={{ fontSize: 24, margin: "7px 0 5px" }}>
              {isConnected ? "Google is connected." : "Connect your Google account."}
            </h2>
            <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
              Kernor requests read-only Gmail and Calendar access for detection. It does
              not send, delete, or edit email or calendar events in this phase.
            </p>
          </div>

          {isConnected ? (
            <GoogleSyncButton />
          ) : (
            <a className="btn btn-primary" href="/api/integrations/google/connect">
              Connect Google
            </a>
          )}
        </div>

        <div className="google-sync-grid">
          <div className="card google-sync-card">
            <span className="muted">Last sync</span>
            <strong>
              {connection?.last_sync_at
                ? new Date(connection.last_sync_at).toLocaleString()
                : "Not synced yet"}
            </strong>
          </div>
          <div className="card google-sync-card">
            <span className="muted">Detected signals</span>
            <strong>{signalCount ?? 0}</strong>
          </div>
        </div>

        {connection?.last_error ? (
          <div className="review-note">
            <strong>Last sync issue:</strong> {connection.last_error}
          </div>
        ) : null}

        <div className="card google-privacy-card">
          <div className="muted" style={{ fontSize: 13 }}>What Kernor looks for</div>
          <div className="google-detection-list">
            <span>Recruiter / employer response</span>
            <span>Assessment or take-home request</span>
            <span>Interview invitation or scheduling update</span>
            <span>Offer or rejection update</span>
          </div>
          <p className="muted" style={{ margin: "18px 0 0", lineHeight: 1.55 }}>
            Messages that cannot be confidently tied to one of your tracked applications
            are ignored instead of changing your pipeline.
          </p>
        </div>
      </div>
    </main>
  );
}
