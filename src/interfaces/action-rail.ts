import type { Interactions, ReactionKey } from "./reactions";

export interface ActionRailProps {
  postId: string;
  interactions: Interactions;
  comments: number;
  saves: number;
  /** Initial reaction from viewer, if any */
  viewerReaction?: ReactionKey | null;
}
