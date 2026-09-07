import { create } from "zustand";

/**
 * Tracks which single video (identified by post id) is allowed to play across
 * the whole app. Playing one claims it here; any other <video> element that's
 * still playing reacts by pausing itself — see reel-player.tsx and
 * post-card.tsx. Without this, a reel autoplaying and a post-card video a
 * user tapped play on could both be audible/decoding at once, since each
 * component only ever managed its own local video refs.
 */
interface ActiveVideoState {
  activeId: string | null;
  setActive: (id: string | null) => void;
}

export const useActiveVideoStore = create<ActiveVideoState>((set) => ({
  activeId: null,
  setActive: (id) => set({ activeId: id }),
}));
