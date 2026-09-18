// Deterministic idempotency keys for credit_transactions.external_reference.
// Because the reference is derived only from the stable ID of the event
// that earns the credit debit (never from a timestamp or random value), a
// retried operation always produces the same reference and collides with
// the table's unique constraint instead of creating a duplicate debit.

export function applicationCreditReference(applicationRunId: string) {
  return `application:${applicationRunId}`;
}

export function liveInterviewCreditReference(liveSessionId: string) {
  return `live:${liveSessionId}`;
}
