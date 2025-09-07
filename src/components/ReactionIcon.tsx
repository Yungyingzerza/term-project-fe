"use client";
import { Angry, Frown, Heart, Laugh, Smile, ThumbsUp } from "lucide-react";
import type { ReactionKey } from "@/interfaces";

export interface ReactionIconProps {
  name: ReactionKey;
  className?: string;
  strokeWidth?: number;
}

export default function ReactionIcon({
  name,
  className,
  strokeWidth = 2,
}: ReactionIconProps) {
  const common = { className, strokeWidth } as const;
  switch (name) {
    case "like":
      return <ThumbsUp {...common} />;
    case "love":
      return <Heart {...common} />;
    case "haha":
      return <Laugh {...common} />;
    case "sad":
      return <Frown {...common} />;
    case "angry":
      return <Angry {...common} />;
    default:
      return <Smile {...common} />;
  }
}
