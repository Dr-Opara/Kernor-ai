import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/app/actions/billing";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const { status, error } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;

  if (!userId) redirect("/login");

  const [{ data: credits }, { data: transactions }] = await Promise.all([
    supabase
      .from("credit_balances")
      .select("application_credits,interview_passes")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("credit_transactions")
      .select("id,credit_type,delta,reason,amount_cents,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return (
    <main className="shell" style={{ padding: "54px 0 100px" }}>
      <Link href="/dashboard" className="wordmark">Odysseus</Link>

      <div style={{ width: "min(980px,100%)", margin: "64px auto 0" }}>
        <div>
          <div className="badge">Billing</div>
          <h1 style={{ fontSize: 48, letterSpacing: "-0.05em", margin: "16px 0 8px" }}>
            Pay for progress, not access.
          </h1>
          <p className="muted" style={{ fontSize: 18, lineHeight: 1.6, maxWidth: 650 }}>
            No subscription. Pay when Odysseus works for you.
          </p>
        </div>

        {status === "success" ? (
          <div className="billing-success">
            Payment received. Your balance will update as soon as Stripe confirms the purchase.
          </div>
        ) : null}

        {status === "cancelled" ? (
          <div className="review-note">Checkout was cancelled. Nothing was charged.</div>
        ) : null}

        {error ? (
          <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: "#fff1ef" }}>
            {error}
          </div>
        ) : null}

        <div className="billing-balance-grid">
          <div className="card billing-balance-card">
            <div className="muted" style={{ fontSize: 13 }}>Application credits</div>
            <strong>{credits?.application_credits ?? 0}</strong>
            <span className="muted">$0.99 is consumed only after a successful submission.</span>
          </div>

          <div className="card billing-balance-card">
            <div className="muted" style={{ fontSize: 13 }}>Interview passes</div>
            <strong>{credits?.interview_passes ?? 0}</strong>
            <span className="muted">One pass is used when Odysseus Live starts.</span>
          </div>
        </div>

        <section style={{ marginTop: 34 }}>
          <div className="billing-pack-grid">
            <form className="card billing-pack" action={createCheckoutSession.bind(null, "app_1")}>
              <div>
                <div className="muted" style={{ fontSize: 13 }}>Apply with Odysseus</div>
                <div className="billing-pack-number">$0.99</div>
                <p className="muted" style={{ lineHeight: 1.55 }}>
                  Odysseus matches the role, tailors your resume, completes the application, submits it, and tracks it.
                </p>
                <p className="muted" style={{ lineHeight: 1.55 }}>
                  $0.99 only after successful submission.
                </p>
                <p className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>
                  Apply across supported job boards and direct employer career sites — no platform-specific fee. Includes Workday, Indeed, UN Careers / UN job portals, Greenhouse, Lever, Ashby, iCIMS, direct company career websites, corporate ATS portals, and other supported job boards and employer application sites.
                </p>
              </div>
              <button className="btn btn-primary" type="submit">Buy an application credit</button>
            </form>

            <form className="card billing-pack" action={createCheckoutSession.bind(null, "interview_1")}>
              <div>
                <div className="muted" style={{ fontSize: 13 }}>Odysseus Live</div>
                <div className="billing-pack-number">$24.99</div>
                <p className="muted" style={{ lineHeight: 1.55 }}>
                  Your AI interview companion—from preparation through follow-up.
                </p>
                <p className="muted" style={{ lineHeight: 1.55 }}>
                  One interview. One pass. Everything included.
                </p>
              </div>
              <button className="btn btn-primary" type="submit">Buy an interview pass</button>
            </form>
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <div className="muted" style={{ fontSize: 13 }}>Recent activity</div>
          <h2 style={{ fontSize: 24, margin: "7px 0 12px" }}>Credits</h2>

          <div className="card">
            {transactions?.length ? transactions.map((transaction, index) => (
              <div
                className="billing-history-row"
                key={transaction.id}
                style={{ borderTop: index ? "1px solid var(--line)" : "none" }}
              >
                <div>
                  <strong>
                    {transaction.delta > 0 ? "Purchased" : "Used"} {Math.abs(transaction.delta)}{" "}
                    {transaction.credit_type === "application" ? "application credit" : "interview pass"}
                    {Math.abs(transaction.delta) === 1 ? "" : "es"}
                  </strong>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    {new Date(transaction.created_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <strong>{transaction.delta > 0 ? "+" : ""}{transaction.delta}</strong>
                  {transaction.amount_cents ? (
                    <div className="muted" style={{ fontSize: 13 }}>
                      ${(transaction.amount_cents / 100).toFixed(2)}
                    </div>
                  ) : null}
                </div>
              </div>
            )) : (
              <div className="muted" style={{ padding: 26 }}>No credit activity yet.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
