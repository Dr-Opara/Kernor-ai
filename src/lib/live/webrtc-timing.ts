// Minimal shape of the RTCPeerConnection surface these helpers depend on,
// so they can be unit tested against a lightweight fake instead of a real
// browser WebRTC stack.
export type IceGatheringLike = {
  iceGatheringState: string;
  addEventListener(type: "icegatheringstatechange", listener: () => void): void;
  removeEventListener(type: "icegatheringstatechange", listener: () => void): void;
};

export type ConnectionStateLike = {
  connectionState: string;
  addEventListener(type: "connectionstatechange", listener: () => void): void;
  removeEventListener(type: "connectionstatechange", listener: () => void): void;
};

export const ICE_GATHERING_TIMEOUT_MS = 4000;
export const PEER_CONNECTED_TIMEOUT_MS = 8000;

// OpenAI's Realtime WebRTC endpoint takes a single non-trickled SDP offer
// and returns a single SDP answer in the same response — there is no
// separate signaling channel for ICE candidates exchanged afterward. An
// offer sent before ICE gathering finishes may be missing srflx/relay
// candidates a NAT'd network needs, so callers should wait for gathering
// to settle (or time out) before reading the final local description.
export function waitForIceGatheringComplete(
  peer: IceGatheringLike,
  timeoutMs = ICE_GATHERING_TIMEOUT_MS
) {
  if (peer.iceGatheringState === "complete") return Promise.resolve();

  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      peer.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    };
    const onChange = () => {
      if (peer.iceGatheringState === "complete") finish();
    };
    peer.addEventListener("icegatheringstatechange", onChange);
    setTimeout(finish, timeoutMs);
  });
}

// Waits for the peer connection to actually establish (ICE + DTLS
// complete), not just for the SDP answer to be applied. A successful SDP
// exchange does not guarantee connectivity — activation (which consumes
// the interview pass) should only happen once the session genuinely works.
export function waitForPeerConnected(
  peer: ConnectionStateLike,
  timeoutMs = PEER_CONNECTED_TIMEOUT_MS
) {
  if (peer.connectionState === "connected") return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      peer.removeEventListener("connectionstatechange", onChange);
      resolve(result);
    };
    const onChange = () => {
      if (peer.connectionState === "connected") finish(true);
      if (peer.connectionState === "failed" || peer.connectionState === "closed") finish(false);
    };
    peer.addEventListener("connectionstatechange", onChange);
    setTimeout(() => finish(peer.connectionState === "connected"), timeoutMs);
  });
}
