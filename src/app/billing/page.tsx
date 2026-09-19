import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/app/actions/billing";

const appPacks = [
  { sku: "app_10" as const, credits: 10, price: "$10" },
  { sku: "app_25" as const, credits: 25, price: "$25" },
  { sku: "app_50" as const, credits: 50, price: "$45", note: "Most popular" },
  { sku: "app_100" as const, credits: 100, price: "$80" },
];

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
            No monthly subscription. Buy application credits when you need them, and activate interview passes only when an interview is actually happening.
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
            <span className="muted">$1 is consumed only after a successful submission.</span>
          </div>

          <div className="card billing-balance-card">
            <div className="muted" style={{ fontSize: 13 }}>Interview passes</div>
            <strong>{credits?.interview_passes ?? 0}</strong>
            <span className="muted">One pass is used when Odysseus Live starts.</span>
          </div>
        </div>

        <section style={{ marginTop: 34 }}>
          <div className="muted" style={{ fontSize: 13 }}>Applications</div>
          <h2 style={{ fontSize: 28, margin: "7px 0 18px" }}>Choose how many you want on hand.</h2>

          <div className="billing-pack-grid">
            {appPacks.map((pack) => (
              <form
                key={pack.sku}
                className="card billing-pack"
                action={createCheckoutSession.bind(null, pack.sku)}
              >
                <div>
                  {pack.note ? <div className="badge">{pack.note}</div> : null}
                  <div className="muted" style={{ fontSize: 13, marginTop: pack.note ? 16 : 0 }}>
                    Application credits
                  </div>
                  <div className="billing-pack-number">{pack.credits}</div>
                  <div className="muted">{pack.price} total</div>
                </div>
                <button className="btn btn-primary" type="submit">Buy credits</button>
              </form>
            ))}
          </div>
        </section>

        <section className="card interview-pass-card">
          <div>
            <div className="muted" style={{ fontSize: 13 }}>Odysseus Live</div>
            <h2 style={{ fontSize: 28, margin: "7px 0 7px" }}>1 interview pass · $19.99</h2>
            <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
              Buy it now or wait until an interview is scheduled. The pass remains unused until the live assistant starts.
            </p>
          </div>
          <form action={createCheckoutSession.bind(null, "interview_1")}>
            <button className="btn btn-primary" type="submit">Buy interview pass</button>
          </form>
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
                      $${(transaction.amount_cents / 100).toFixed(2)}
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
