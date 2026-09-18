import { describe, expect, it } from "vitest";
import {
  liveGuidanceSchema,
  postInterviewAnalysisSchema,
  roundHandoffSchema,
} from "@/lib/ai/schemas";
import { POST_INTERVIEW_ANALYSIS_SYSTEM_PROMPT } from "@/lib/ai/post-interview";
import { LIVE_GUIDANCE_SYSTEM_PROMPT } from "@/lib/ai/live-guidance";
import { ROUND_HANDOFF_SYSTEM_PROMPT } from "@/lib/ai/round-handoff";

// Forbidden keys anywhere in a schema's shape would mean the model is being
// asked to produce a score, rank, or hiring-outcome prediction — exactly
// what AGENTS.md's post-interview rules and interview memory rules forbid.
const forbiddenKeyPattern =
  /score|rank|probability|likelihood|grade|willAdvance|hireable|chance|percent/i;

function assertNoForbiddenKeys(shape: Record<string, unknown>, path = "") {
  for (const key of Object.keys(shape)) {
    const fullPath = path ? `${path}.${key}` : key;
    expect(key, `forbidden-looking key found at ${fullPath}`).not.toMatch(
      forbiddenKeyPattern
    );
  }
}

describe("postInterviewAnalysisSchema", () => {
  const validAnalysis = {
    factualSummary: "The candidate discussed prior backend work and system design tradeoffs.",
    transcriptLimitations: ["Mixed audio; speaker attribution is not certain throughout."],
    questionsAsked: ["Tell me about a challenging bug you fixed."],
    topicsDiscussed: ["Distributed systems"],
    experiencesReferenced: ["Led a migration from monolith to microservices"],
    commitments: ["Send a writing sample by Friday"],
    answersToStrengthen: [
      {
        topic: "Scaling databases",
        observation: "The answer stayed high-level.",
        strongerApproach: "Reference a specific past scaling decision with concrete numbers.",
      },
    ],
    possibleNextRoundTopics: [
      { topic: "System design deep dive", rationale: "Role is senior backend." },
    ],
    followUpDraft: {
      subject: "Thank you for the conversation",
      body: "Thank you for taking the time to speak with me today.",
    },
  };

  it("accepts a well-formed, non-predictive analysis payload", () => {
    const result = postInterviewAnalysisSchema.safeParse(validAnalysis);
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing required factual fields", () => {
    const { factualSummary, ...incomplete } = validAnalysis;
    void factualSummary;
    const result = postInterviewAnalysisSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it("does not declare any score/rank/probability/prediction-shaped field", () => {
    assertNoForbiddenKeys(postInterviewAnalysisSchema.shape);
    assertNoForbiddenKeys(postInterviewAnalysisSchema.shape.answersToStrengthen.element.shape);
    assertNoForbiddenKeys(postInterviewAnalysisSchema.shape.possibleNextRoundTopics.element.shape);
  });

  it("keeps the system prompt's non-predictive guardrails intact", () => {
    expect(POST_INTERVIEW_ANALYSIS_SYSTEM_PROMPT).toMatch(/do not predict/i);
    expect(POST_INTERVIEW_ANALYSIS_SYSTEM_PROMPT).toMatch(/do not grade, score, rank/i);
    expect(POST_INTERVIEW_ANALYSIS_SYSTEM_PROMPT).toMatch(/hiring probability/i);
    expect(POST_INTERVIEW_ANALYSIS_SYSTEM_PROMPT).toMatch(/do not invent candidate experience/i);
  });
});

describe("liveGuidanceSchema", () => {
  const validGuidance = {
    isQuestion: true,
    questionText: "What's your experience with distributed systems?",
    responseText: "I led the migration of our payments service to a distributed architecture.",
    structure: "star",
    verifiedEvidence: ["Led payments service migration (resume)"],
    caution: null,
  };

  it("accepts a well-formed guidance payload", () => {
    expect(liveGuidanceSchema.safeParse(validGuidance).success).toBe(true);
  });

  it("rejects a payload with a non-boolean isQuestion", () => {
    const result = liveGuidanceSchema.safeParse({ ...validGuidance, isQuestion: "yes" });
    expect(result.success).toBe(false);
  });

  it("does not declare any score/rank/probability-shaped field", () => {
    assertNoForbiddenKeys(liveGuidanceSchema.shape);
  });

  it("keeps the system prompt's grounding-only guardrails intact", () => {
    expect(LIVE_GUIDANCE_SYSTEM_PROMPT).toMatch(/use only verified facts/i);
    expect(LIVE_GUIDANCE_SYSTEM_PROMPT).toMatch(/never invent experience/i);
    expect(LIVE_GUIDANCE_SYSTEM_PROMPT).toMatch(/the candidate remains the speaker/i);
    expect(LIVE_GUIDANCE_SYSTEM_PROMPT).toMatch(/do not pretend the candidate did something they did not do/i);
  });
});

describe("roundHandoffSchema", () => {
  const validHandoff = {
    summary: "Round 1 focused on system design and prior migration experience.",
    buildOn: ["The candidate's migration story landed well"],
    avoidRepeating: ["Don't re-ask about the same migration project"],
    openThreads: ["Interviewer wanted a follow-up on testing strategy"],
    nextRoundFocus: ["Be ready to go deeper on testing and rollout strategy"],
  };

  it("accepts a well-formed handoff payload", () => {
    expect(roundHandoffSchema.safeParse(validHandoff).success).toBe(true);
  });

  it("caps each list field at 8 items", () => {
    const tooMany = Array.from({ length: 9 }, (_, i) => `item ${i}`);
    const result = roundHandoffSchema.safeParse({ ...validHandoff, buildOn: tooMany });
    expect(result.success).toBe(false);
  });

  it("does not declare any score/rank/probability-shaped field", () => {
    assertNoForbiddenKeys(roundHandoffSchema.shape);
  });

  it("keeps the system prompt's non-predictive continuity guardrails intact", () => {
    expect(ROUND_HANDOFF_SYSTEM_PROMPT).toMatch(/do not predict whether the candidate will get the job/i);
    expect(ROUND_HANDOFF_SYSTEM_PROMPT).toMatch(/do not grade performance/i);
    expect(ROUND_HANDOFF_SYSTEM_PROMPT).toMatch(/do not invent questions, commitments, topics, or experiences/i);
  });
});
