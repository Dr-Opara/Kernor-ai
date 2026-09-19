import { describe, expect, it } from "vitest";
import { canStartLive, createTurnSequencer } from "@/lib/live/session-state";

describe("canStartLive", () => {
  it("allows starting from idle with consent and an available pass", () => {
    expect(canStartLive("idle", true, 1)).toBe(true);
  });

  it("allows retrying from the error state without a page refresh", () => {
    // This is the exact bug the audit flagged: retry must not be blocked
    // by an idle-only gate, since the button is shown in both idle and
    // error states.
    expect(canStartLive("error", true, 1)).toBe(true);
  });

  it("refuses to start without consent, regardless of state", () => {
    expect(canStartLive("idle", false, 1)).toBe(false);
    expect(canStartLive("error", false, 1)).toBe(false);
  });

  it("refuses to start with zero interview passes", () => {
    expect(canStartLive("idle", true, 0)).toBe(false);
  });

  it("refuses to start while already connecting, live, or ending", () => {
    expect(canStartLive("connecting", true, 1)).toBe(false);
    expect(canStartLive("live", true, 1)).toBe(false);
    expect(canStartLive("ending", true, 1)).toBe(false);
  });

  it("refuses to start once the session has already ended", () => {
    expect(canStartLive("ended", true, 1)).toBe(false);
  });
});

describe("createTurnSequencer", () => {
  it("assigns increasing indexes in first-seen order", () => {
    const sequencer = createTurnSequencer();
    expect(sequencer.turnIndexFor("item-a")).toBe(0);
    expect(sequencer.turnIndexFor("item-b")).toBe(1);
    expect(sequencer.turnIndexFor("item-c")).toBe(2);
  });

  it("returns the same index for the same item on repeated calls", () => {
    const sequencer = createTurnSequencer();
    const first = sequencer.turnIndexFor("item-a");
    expect(sequencer.turnIndexFor("item-a")).toBe(first);
    expect(sequencer.turnIndexFor("item-a")).toBe(first);
  });

  it("locks in order from first observation, not from completion order", () => {
    // Simulates: item A's delta arrives first (so it should keep the
    // earlier turn index) even though item B's completion event happens
    // to be handled first.
    const sequencer = createTurnSequencer();
    sequencer.turnIndexFor("item-a"); // A's delta seen first
    sequencer.turnIndexFor("item-b"); // B's delta seen second

    // B completes first over the wire — its index was already locked in
    // by the earlier delta observation, so it stays after A.
    expect(sequencer.turnIndexFor("item-b")).toBe(1);
    expect(sequencer.turnIndexFor("item-a")).toBe(0);
  });

  it("peek returns undefined for an item that has never been observed", () => {
    const sequencer = createTurnSequencer();
    expect(sequencer.peek("never-seen")).toBeUndefined();
    sequencer.turnIndexFor("now-seen");
    expect(sequencer.peek("now-seen")).toBe(0);
  });

  it("keeps independent sequences across separate sequencer instances", () => {
    const a = createTurnSequencer();
    const b = createTurnSequencer();
    a.turnIndexFor("x");
    a.turnIndexFor("y");
    expect(b.turnIndexFor("z")).toBe(0);
  });
});
