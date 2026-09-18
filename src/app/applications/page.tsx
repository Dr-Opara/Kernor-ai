import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: applications } = await supabase
    .from("applications")
    .select("id,company_name,role_title,status,last_event_at")
    .eq("user_id", userId)
    .order("last_event_at", { ascending: false });

  return (
    <main className="shell" style={{ padding: "54px 0 90px" }}>
      <Link href="/dashboard" className="wordmark">Kernor</Link>

      <div className="page-heading">
        <div>
          <h1 style={{ fontSize: 46, letterSpacing: "-0.05em", margin: 0 }}>Applications</h1>
          <p className="muted">Everything you have in motion.</p>
        </div>
        <Link className="btn btn-primary" href="/match">Check a job</Link>
      </div>

      <div className="card" style={{ marginTop: 28, overflow: "hidden" }}>
        {applications?.length ? (
          applications.map((application, index) => (
            <div key={application.id} className="applications-list-row" style={{ borderTop: index ? "1px solid var(--line)" : "none" }}>
              <strong>{application.company_name}</strong>
              <span className="muted">{application.role_title}</span>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: "capitalize" }}>
                {application.status.replaceAll("_", " ")}
              </span>
            </div>
          ))
        ) : (
          <div style={{ padding: 34 }}>
            <div className="badge">No applications yet</div>
            <h2 style={{ fontSize: 28, margin: "18px 0 8px" }}>Your pipeline will stay simple.</h2>
            <p className="muted" style={{ maxWidth: 540, lineHeight: 1.6 }}>
              Once you approve and submit a job, Kernor will track it here from application through interview and offer.
            </p>
            <Link className="btn btn-primary" href="/match" style={{ marginTop: 14 }}>Check a job</Link>
          </div>
        )}
      </div>
    </main>
  );
}
