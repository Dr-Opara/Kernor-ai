export const applicationStatuses = [
  "applied",
  "employer_response",
  "assessment",
  "interview",
  "rejected",
  "withdrawn",
  "offer",
  "accepted",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  applied: "Applied",
  employer_response: "Employer response",
  assessment: "Assessment",
  interview: "Interview",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  offer: "Offer",
  accepted: "Accepted",
};

export function statusLabel(status: string) {
  return applicationStatusLabels[status as ApplicationStatus] || status.replaceAll("_", " ");
}
