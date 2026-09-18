export type ExistingRoundMemory = {
  round_number?: number | null;
  questions_asked?: string[] | null;
  topics_discussed?: string[] | null;
  experiences_used?: string[] | null;
  interviewer_signals?: string[] | null;
  commitments?: string[] | null;
  candidate_notes?: string | null;
  source?: string | null;
} | null;

export type AnalysisFacts = {
  questionsAsked: string[];
  topicsDiscussed: string[];
  experiencesReferenced: string[];
  commitments: string[];
};

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

// Merges transcript-derived facts from a completed Live session into the
// current interview round's memory. User-entered notes and signals are
// preserved rather than overwritten (source only flips to "live" if the
// user never took ownership of this round's notes), and every list field
// is deduplicated rather than replaced, so nothing already recorded is
// silently dropped.
export function mergeRoundMemory(input: {
  existingMemory: ExistingRoundMemory;
  analysis: AnalysisFacts;
  interviewRoundNumber: number | null;
  priorRoundsCount: number;
}) {
  const { existingMemory, analysis, interviewRoundNumber, priorRoundsCount } = input;

  const roundNumber =
    interviewRoundNumber || existingMemory?.round_number || priorRoundsCount + 1;

  return {
    round_number: roundNumber,
    questions_asked: unique([
      ...(existingMemory?.questions_asked || []),
      ...analysis.questionsAsked,
    ]),
    topics_discussed: unique([
      ...(existingMemory?.topics_discussed || []),
      ...analysis.topicsDiscussed,
    ]),
    experiences_used: unique([
      ...(existingMemory?.experiences_used || []),
      ...analysis.experiencesReferenced,
    ]),
    // Interviewer signals are candidate-observed, not transcript-derived —
    // never auto-populated from the analysis, only ever user-entered.
    interviewer_signals: existingMemory?.interviewer_signals || [],
    commitments: unique([
      ...(existingMemory?.commitments || []),
      ...analysis.commitments,
    ]),
    candidate_notes: existingMemory?.candidate_notes || null,
    source: existingMemory?.source === "user" ? "user" : "live",
  };
}
