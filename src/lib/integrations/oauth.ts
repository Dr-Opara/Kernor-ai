import { getToken, startAuthorization } from "@vercel/connect";
import {
  connectorFor,
  type IntegrationProvider,
  type IntegrationService,
} from "./providers";

export async function getProviderToken(
  userId: string,
  provider: IntegrationProvider,
  service: IntegrationService
) {
  return getToken(connectorFor(provider, service), {
    subject: { type: "user", id: userId },
  });
}

export async function startProviderAuthorization(
  userId: string,
  provider: IntegrationProvider,
  service: IntegrationService,
  callbackUrl: string
) {
  return startAuthorization(
    connectorFor(provider, service),
    { subject: { type: "user", id: userId } },
    { callbackUrl }
  );
}
