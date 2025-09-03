import { Music2 } from "lucide-react";
import { MusicTickerProps } from "./types";

export default function MusicTicker({ text }: MusicTickerProps) {
  return (
    <div className="absolute left-2 sm:left-4 bottom-4 pr-20 flex items-center gap-2 text-sm z-30">
      <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur border border-white/10">
        <Music2 className="w-4 h-4" />
        <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[60vw] sm:max-w-xs">{text}</span>
      </div>
    </div>
  );
}
