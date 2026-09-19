import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  syncIntegrationAccount,
  type IntegrationAccount,
} from "@/lib/integrations/account-sync";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");

  if (
    !process.env.CRON_SECRET ||
    auth !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: accounts } = await service
    .from("integration_accounts")
    .select("*")
    .eq("status", "connected");

  let synced = 0;
  let failed = 0;

  for (const account of (accounts || []) as IntegrationAccount[]) {
    try {
      await syncIntegrationAccount(account);
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, synced, failed });
}
