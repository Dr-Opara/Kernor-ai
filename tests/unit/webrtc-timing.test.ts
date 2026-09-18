import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  waitForIceGatheringComplete,
  waitForPeerConnected,
  type ConnectionStateLike,
  type IceGatheringLike,
} from "@/lib/live/webrtc-timing";

function fakeIceGathering(initialState: string): IceGatheringLike & {
  setState(state: string): void;
} {
  let state = initialState;
  let listener: (() => void) | null = null;
  return {
    get iceGatheringState() {
      return state;
    },
    addEventListener: (_type, cb) => {
      listener = cb;
    },
    removeEventListener: () => {
      listener = null;
    },
    setState(next: string) {
      state = next;
      listener?.();
    },
  };
}

function fakeConnectionState(initialState: string): ConnectionStateLike & {
  setState(state: string): void;
} {
  let state = initialState;
  let listener: (() => void) | null = null;
  return {
    get connectionState() {
      return state;
    },
    addEventListener: (_type, cb) => {
      listener = cb;
    },
    removeEventListener: () => {
      listener = null;
    },
    setState(next: string) {
      state = next;
      listener?.();
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("waitForIceGatheringComplete", () => {
  it("resolves immediately when gathering is already complete", async () => {
    const peer = fakeIceGathering("complete");
    let resolved = false;
    waitForIceGatheringComplete(peer).then(() => {
      resolved = true;
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).toBe(true);
  });

  it("resolves once gathering transitions to complete", async () => {
    const peer = fakeIceGathering("gathering");
    let resolved = false;
    waitForIceGatheringComplete(peer, 4000).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(100);
    expect(resolved).toBe(false);

    peer.setState("complete");
    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).toBe(true);
  });

  it("falls back to resolving after the timeout if gathering never completes", async () => {
    const peer = fakeIceGathering("gathering");
    let resolved = false;
    waitForIceGatheringComplete(peer, 4000).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(3999);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toBe(true);
  });
});

describe("waitForPeerConnected", () => {
  it("resolves true immediately when already connected", async () => {
    const peer = fakeConnectionState("connected");
    const result = await waitForPeerConnected(peer);
    expect(result).toBe(true);
  });

  it("resolves true once the connection transitions to connected", async () => {
    const peer = fakeConnectionState("connecting");
    let result: boolean | null = null;
    waitForPeerConnected(peer, 8000).then((r) => {
      result = r;
    });

    await vi.advanceTimersByTimeAsync(50);
    expect(result).toBeNull();

    peer.setState("connected");
    await vi.advanceTimersByTimeAsync(0);
    expect(result).toBe(true);
  });

  it("resolves false as soon as the connection fails, without waiting for the timeout", async () => {
    const peer = fakeConnectionState("connecting");
    let result: boolean | null = null;
    waitForPeerConnected(peer, 8000).then((r) => {
      result = r;
    });

    peer.setState("failed");
    await vi.advanceTimersByTimeAsync(0);
    expect(result).toBe(false);

    // Confirms it settled early rather than waiting out the full timeout.
    await vi.advanceTimersByTimeAsync(8000);
    expect(result).toBe(false);
  });

  it("resolves false after the timeout if the connection never settles — this is what prevents charging a credit for a connection that never actually worked", async () => {
    const peer = fakeConnectionState("connecting");
    let result: boolean | null = null;
    waitForPeerConnected(peer, 8000).then((r) => {
      result = r;
    });

    await vi.advanceTimersByTimeAsync(7999);
    expect(result).toBeNull();

    await vi.advanceTimersByTimeAsync(1);
    expect(result).toBe(false);
  });
});
