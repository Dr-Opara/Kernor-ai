import { describe, expect, it } from "vitest";
import { mergeRoundMemory } from "@/lib/interviews/round-memory-merge";

const baseAnalysis = {
  questionsAsked: ["Tell me about a time you led a project."],
  topicsDiscussed: ["System design"],
  experiencesReferenced: ["Migrated payments service to Go"],
  commitments: ["Send portfolio link"],
};

describe("mergeRoundMemory", () => {
  it("uses the analysis facts directly when there is no existing memory", () => {
    const result = mergeRoundMemory({
      existingMemory: null,
      analysis: baseAnalysis,
      interviewRoundNumber: null,
      priorRoundsCount: 0,
    });

    expect(result.questions_asked).toEqual(baseAnalysis.questionsAsked);
    expect(result.topics_discussed).toEqual(baseAnalysis.topicsDiscussed);
    expect(result.experiences_used).toEqual(baseAnalysis.experiencesReferenced);
    expect(result.commitments).toEqual(baseAnalysis.commitments);
    expect(result.interviewer_signals).toEqual([]);
    expect(result.candidate_notes).toBeNull();
    expect(result.source).toBe("live");
    expect(result.round_number).toBe(1);
  });

  it("preserves existing user-entered notes and interviewer signals rather than overwriting them", () => {
    const result = mergeRoundMemory({
      existingMemory: {
        candidate_notes: "Interviewer seemed very focused on Kubernetes experience.",
        interviewer_signals: ["Asked twice about container orchestration"],
        source: "user",
      },
      analysis: baseAnalysis,
      interviewRoundNumber: 1,
      priorRoundsCount: 0,
    });

    expect(result.candidate_notes).toBe(
      "Interviewer seemed very focused on Kubernetes experience."
    );
    expect(result.interviewer_signals).toEqual([
      "Asked twice about container orchestration",
    ]);
  });

  it("keeps source as user when the candidate already owns this round's notes", () => {
    const result = mergeRoundMemory({
      existingMemory: { source: "user" },
      analysis: baseAnalysis,
      interviewRoundNumber: 1,
      priorRoundsCount: 0,
    });
    expect(result.source).toBe("user");
  });

  it("flips source to live when the round has no prior user ownership", () => {
    const result = mergeRoundMemory({
      existingMemory: { source: "live" },
      analysis: baseAnalysis,
      interviewRoundNumber: 1,
      priorRoundsCount: 0,
    });
    expect(result.source).toBe("live");

    const withNoExisting = mergeRoundMemory({
      existingMemory: null,
      analysis: baseAnalysis,
      interviewRoundNumber: 1,
      priorRoundsCount: 0,
    });
    expect(withNoExisting.source).toBe("live");
  });

  it("deduplicates overlapping facts between existing memory and new analysis", () => {
    const result = mergeRoundMemory({
      existingMemory: {
        questions_asked: ["Tell me about a time you led a project.", "What's your tech stack?"],
      },
      analysis: baseAnalysis,
      interviewRoundNumber: 1,
      priorRoundsCount: 0,
    });

    expect(result.questions_asked).toEqual([
      "Tell me about a time you led a project.",
      "What's your tech stack?",
    ]);
  });

  it("trims whitespace and drops empty strings when merging", () => {
    const result = mergeRoundMemory({
      existingMemory: { topics_discussed: ["  System design  ", "", "   "] },
      analysis: { ...baseAnalysis, topicsDiscussed: ["Scalability"] },
      interviewRoundNumber: 1,
      priorRoundsCount: 0,
    });

    expect(result.topics_discussed).toEqual(["System design", "Scalability"]);
  });

  it("never derives interviewer_signals from the analysis, even if it were somehow present", () => {
    const result = mergeRoundMemory({
      existingMemory: null,
      analysis: baseAnalysis,
      interviewRoundNumber: 1,
      priorRoundsCount: 0,
    });
    expect(result.interviewer_signals).toEqual([]);
  });

  it("resolves round number by precedence: interview.round_number, then existing memory, then prior-rounds count + 1", () => {
    expect(
      mergeRoundMemory({
        existingMemory: { round_number: 2 },
        analysis: baseAnalysis,
        interviewRoundNumber: 3,
        priorRoundsCount: 5,
      }).round_number
    ).toBe(3);

    expect(
      mergeRoundMemory({
        existingMemory: { round_number: 2 },
        analysis: baseAnalysis,
        interviewRoundNumber: null,
        priorRoundsCount: 5,
      }).round_number
    ).toBe(2);

    expect(
      mergeRoundMemory({
        existingMemory: null,
        analysis: baseAnalysis,
        interviewRoundNumber: null,
        priorRoundsCount: 2,
      }).round_number
    ).toBe(3);
  });
});
