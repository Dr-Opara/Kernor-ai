import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  integrationProviders,
  type IntegrationProvider,
  type IntegrationService,
} from "@/lib/integrations/providers";
import { startProviderAuthorization } from "@/lib/integrations/oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") as IntegrationProvider | null;
  const service = url.searchParams.get("service") as IntegrationService | null;
  const accountEmail = url.searchParams.get("email")?.trim() || null;

  if (!provider || !service || !integrationProviders[provider]) {
    return NextResponse.redirect(new URL("/integrations?error=Invalid%20provider", request.url));
  }

  const definition = integrationProviders[provider];
  if (
    definition.authMethod !== "oauth" ||
    !definition.services.includes(service)
  ) {
    return NextResponse.redirect(new URL("/integrations?error=Unsupported%20connection", request.url));
  }

  if (provider === "yahoo" && !accountEmail) {
    return NextResponse.redirect(new URL("/integrations?error=Yahoo%20email%20is%20required", request.url));
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return NextResponse.redirect(new URL("/integrations?error=Integration%20is%20not%20configured", request.url));
  }

  const serviceClient = createServiceClient();

  const values = {
    user_id: userId,
    service_type: service,
    provider,
    account_email: accountEmail,
    auth_method: "oauth",
    connector_id:
      service === "email"
        ? process.env[
            definition.emailConnectorEnv || ""
          ] || null
        : process.env[
            definition.calendarConnectorEnv || ""
          ] || null,
    status: "connecting",
    updated_at: new Date().toISOString(),
  };

  let query = serviceClient
    .from("integration_accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("service_type", service)
    .eq("provider", provider);

  query = accountEmail
    ? query.eq("account_email", accountEmail)
    : query.is("account_email", null);

  const { data: existing } = await query.maybeSingle();

  let accountId = existing?.id;

  if (accountId) {
    await serviceClient
      .from("integration_accounts")
      .update(values)
      .eq("id", accountId);
  } else {
    const { data: created } = await serviceClient
      .from("integration_accounts")
      .insert(values)
      .select("id")
      .single();

    accountId = created?.id;
  }

  if (!accountId) {
    return NextResponse.redirect(new URL("/integrations?error=Connection%20could%20not%20start", request.url));
  }

  const authorization = await startProviderAuthorization(
    userId,
    provider,
    service,
    `${siteUrl}/integrations?connected=${accountId}`
  );

  return NextResponse.redirect(authorization.url);
}
