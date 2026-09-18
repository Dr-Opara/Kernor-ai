export const billingCatalog = {
  app_10: { label: "10 application credits", description: "10 successful AI-submitted applications", amountCents: 1000, creditType: "application" as const, creditDelta: 10 },
  app_25: { label: "25 application credits", description: "25 successful AI-submitted applications", amountCents: 2500, creditType: "application" as const, creditDelta: 25 },
  app_50: { label: "50 application credits", description: "50 successful AI-submitted applications", amountCents: 4500, creditType: "application" as const, creditDelta: 50 },
  app_100: { label: "100 application credits", description: "100 successful AI-submitted applications", amountCents: 8000, creditType: "application" as const, creditDelta: 100 },
  interview_1: { label: "1 live interview pass", description: "One Kernor Live interview session", amountCents: 1999, creditType: "interview" as const, creditDelta: 1 },
} as const;

export type BillingSku = keyof typeof billingCatalog;
