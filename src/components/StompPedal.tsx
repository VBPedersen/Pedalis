import React from "react";
import { Pencil } from "lucide-react";
import type { Stomp } from "../types";

interface Props {
    stomp: Stomp;
    onToggle: () => void;
    onEdit: () => void;
}

export const StompPedal: React.FC<Props> = ({ stomp, onToggle, onEdit }) => {
    return (
        <div className="relative group">
            <button
                onClick={onToggle}
                title={stomp.hotkey ? `Hotkey: ${stomp.hotkey}` : undefined}
                className={`
          relative flex flex-col items-center justify-between
          w-24 h-32 rounded-xl border-2 transition-all duration-150
          select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30
          ${stomp.isActive
                    ? `${stomp.color} border-white/60 shadow-lg shadow-white/10 scale-[0.97]`
                    : "bg-zinc-800 border-zinc-600 hover:border-zinc-400 hover:bg-zinc-700"
                }
        `}
            >
                {/* LED indicator */}
                <div className="pt-3">
                    <div
                        className={`w-3 h-3 rounded-full transition-all duration-150 ${
                            stomp.isActive
                                ? "bg-white shadow-[0_0_8px_3px_rgba(255,255,255,0.6)]"
                                : "bg-zinc-600"
                        }`}
                    />
                </div>

                {/* Label */}
                <div className="pb-3 text-center">
          <span className={`text-xs font-bold tracking-widest uppercase ${
              stomp.isActive ? "text-white" : "text-zinc-400"
          }`}>
            {stomp.label}
          </span>
                    {stomp.hotkey && (
                        <div className={`text-[10px] mt-0.5 font-mono ${
                            stomp.isActive ? "text-white/60" : "text-zinc-600"
                        }`}>
                            [{stomp.hotkey}]
                        </div>
                    )}
                </div>

                {/* Bottom "footswitch" circle */}
                <div className={`absolute bottom-13 w-10 h-10 rounded-full border-2 ${
                    stomp.isActive
                        ? "border-white/40 bg-white/10"
                        : "border-zinc-600 bg-zinc-900"
                }`} />
            </button>

            {/* Edit icon — appears on hover */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                }}
                title="Edit stomp"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Pencil size={11} className="text-zinc-300" />
            </button>
        </div>
    );
};
