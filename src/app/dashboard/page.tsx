import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] || "there";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;

  if (!userId) redirect("/login");

  const [{ data: profile }, { data: credits }, { data: jobs }, { data: applications }, { data: interviews }] = await Promise.all([
    supabase.from("profiles").select("full_name,onboarding_completed").eq("id", userId).maybeSingle(),
    supabase.from("credit_balances").select("application_credits,interview_passes").eq("user_id", userId).maybeSingle(),
    supabase.from("job_opportunities").select("id,company_name,role_title,location,match_score,status").order("match_score", { ascending: false }).limit(1),
    supabase.from("applications").select("id,company_name,role_title,status,last_event_at").order("last_event_at", { ascending: false }).limit(4),
    supabase.from("interviews").select("id,stage,scheduled_at,status,meeting_provider,application_id").in("status", ["invited","scheduled","ready"]).order("scheduled_at", { ascending: true }).limit(1),
  ]);

  if (!profile?.onboarding_completed) redirect("/onboarding");

  const bestJob = jobs?.[0];
  const nextInterview = interviews?.[0];

  return (
    <main>
      <header className="app-header">
        <div className="shell app-header-inner">
          <Link href="/" className="wordmark">Odysseus</Link>
          <nav className="app-nav">
            <Link href="/dashboard">Home</Link>
            <Link href="/applications">Applications</Link>
            <Link href="/interviews">Interviews</Link>
            <Link href="/profile">Profile</Link>
          </nav>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link href="/billing" className="muted credit-link" style={{ fontSize: 14 }}>{credits?.application_credits ?? 0} credits</Link>
            <div className="avatar" title={profile?.full_name || undefined}>{firstName(profile?.full_name).slice(0, 1).toUpperCase()}</div>
            <form action={logout}>
              <button type="submit" className="muted" style={{ fontSize: 14, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="shell" style={{ padding: "64px 0 90px" }}>
        <div className="dashboard-heading">
          <div>
            <h1 style={{ fontSize: 46, letterSpacing: "-0.05em", margin: 0 }}>Good to see you, {firstName(profile?.full_name)}.</h1>
            <p className="muted" style={{ fontSize: 18, marginTop: 12 }}>
              {bestJob || applications?.length || nextInterview ? "Here’s what needs your attention." : "Odysseus is ready for your first move."}
            </p>
          </div>
          <Link className="btn btn-primary" href="/match">Check a job</Link>
        </div>

        <div className="dashboard-main-grid">
          <div className="card" style={{ padding: 28 }}>
            {bestJob ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center" }}>
                  <div>
                    <div className="muted" style={{ fontSize: 13 }}>Best current match</div>
                    <h2 style={{ fontSize: 28, margin: "8px 0 4px" }}>{bestJob.role_title}</h2>
                    <div className="muted">{bestJob.company_name}{bestJob.location ? ` · ${bestJob.location}` : ""}</div>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800 }}>{bestJob.match_score ?? "—"}%</div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
                  <Link className="btn btn-primary" href={`/match/${bestJob.id}`}>View match</Link>
                </div>
              </>
            ) : (
              <div style={{ padding: "22px 0" }}>
                <div className="badge">Ready when you are</div>
                <h2 style={{ fontSize: 30, margin: "18px 0 8px" }}>Find your first strong match.</h2>
                <p className="muted" style={{ maxWidth: 520, lineHeight: 1.6 }}>
                  Odysseus will only surface roles that fit the profile and preferences you approved.
                </p>
                <Link className="btn btn-primary" href="/match" style={{ marginTop: 14 }}>Check a job</Link>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 28 }}>
            <div className="muted" style={{ fontSize: 13 }}>Upcoming interview</div>
            {nextInterview ? (
              <>
                <h2 style={{ fontSize: 24, margin: "10px 0 4px" }}>{nextInterview.stage || "Interview"}</h2>
                <div className="muted">{nextInterview.meeting_provider || "Meeting details pending"}</div>
                <div style={{ margin: "28px 0", fontSize: 14 }}>
                  {nextInterview.scheduled_at ? new Date(nextInterview.scheduled_at).toLocaleString() : "Time pending"}
                </div>
                <Link href="/interviews" className="btn btn-secondary" style={{ width: "100%" }}>Open interview</Link>
              </>
            ) : (
              <div style={{ paddingTop: 18 }}>
                <h2 style={{ fontSize: 24, margin: "10px 0 6px" }}>Nothing scheduled.</h2>
                <p className="muted" style={{ lineHeight: 1.55 }}>When an interview arrives, it will appear here automatically.</p>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 26, marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: 20, margin: 0 }}>Applications</h2>
            <Link className="muted" href="/applications" style={{ fontSize: 14 }}>View all</Link>
          </div>

          {applications?.length ? applications.map((application) => (
            <div key={application.id} className="application-row">
              <div><strong>{application.company_name}</strong><div className="muted" style={{ fontSize: 14, marginTop: 4 }}>{application.role_title}</div></div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{application.status.replaceAll("_", " ")}</span>
            </div>
          )) : (
            <div className="muted" style={{ padding: "26px 0 8px" }}>No applications yet. Your submitted applications will stay organized here.</div>
          )}
        </div>
      </section>
    </main>
  );
}
