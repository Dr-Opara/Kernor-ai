export const billingCatalog = {
  app_1: { label: "1 application credit", description: "One successful AI-submitted application across supported job boards and employer career sites", amountCents: 99, creditType: "application" as const, creditDelta: 1 },
  interview_1: { label: "1 live interview pass", description: "One Odysseus Live interview session", amountCents: 2499, creditType: "interview" as const, creditDelta: 1 },
} as const;

export type BillingSku = keyof typeof billingCatalog;
