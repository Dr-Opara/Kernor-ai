import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function InterviewsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: interviews } = await supabase
    .from("interviews")
    .select("id,stage,scheduled_at,status,meeting_provider,live_pass_status,application_id,applications(company_name,role_title)")
    .eq("user_id", userId)
    .order("scheduled_at", { ascending: true });

  const upcoming = interviews?.find((item) => ["invited","scheduled","ready","live"].includes(item.status));

  return (
    <main className="shell" style={{ padding: "54px 0 90px" }}>
      <Link href="/dashboard" className="wordmark">Kernor</Link>

      <div style={{ width: "min(760px,100%)", margin: "70px auto 0" }}>
        <div className="muted" style={{ fontSize: 14 }}>Interviews</div>

        {upcoming ? (
          <>
            <h1 style={{ fontSize: 46, letterSpacing: "-0.05em", margin: "10px 0 6px" }}>
              {upcoming.applications?.role_title || upcoming.stage || "Upcoming interview"}
            </h1>
            <p className="muted" style={{ fontSize: 18 }}>
              {upcoming.applications?.company_name || "Company"} · {upcoming.scheduled_at ? new Date(upcoming.scheduled_at).toLocaleString() : "Time pending"}
            </p>

            <div className="card" style={{ padding: 28, marginTop: 30 }}>
              <h2 style={{ marginTop: 0 }}>Your interview workspace is ready.</h2>
              <div style={{ display: "grid", gap: 12, margin: "24px 0" }}>
                {["Submitted resume","Job description","Candidate profile","Application history"].map((item) => (
                  <div key={item} style={{ display: "flex", justifyContent: "space-between", padding: "13px 0", borderTop: "1px solid var(--line)" }}>
                    <span>{item}</span><span style={{ color: "var(--accent)", fontWeight: 700 }}>Ready</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: 20, borderRadius: 14, background: "#f5f5f2", marginBottom: 20 }}>
                <strong>Kernor Live · $19.99</strong>
                <p className="muted" style={{ margin: "7px 0 0", lineHeight: 1.5 }}>
                  Activate when your interview begins. Your pass is only used when the live assistant starts.
                </p>
              </div>

              <button className="btn btn-primary" style={{ width: "100%" }}>Set up interview</button>
            </div>
          </>
        ) : (
          <div className="card" style={{ padding: 34, marginTop: 30 }}>
            <div className="badge">Nothing scheduled</div>
            <h1 style={{ fontSize: 36, letterSpacing: "-0.04em", margin: "18px 0 8px" }}>Your interview workspace will appear here.</h1>
            <p className="muted" style={{ lineHeight: 1.6 }}>
              When Kernor detects an interview invitation for one of your applications, it will connect the job, submitted resume, and application history automatically.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
