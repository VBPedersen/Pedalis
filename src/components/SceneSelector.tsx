import React from "react";
import { Pencil, Plus } from "lucide-react";
import type { Scene } from "../types";

interface Props {
    scenes: Scene[];
    activeSceneId: string | null;
    onActivate: (id: string) => void;
    onEdit: (scene: Scene) => void;
    onAdd: () => void;
}

export const SceneSelector: React.FC<Props> = ({
                                                   scenes,
                                                   activeSceneId,
                                                   onActivate,
                                                   onEdit,
                                                   onAdd,
                                               }) => {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                    Scenes
                </p>
                <button
                    onClick={onAdd}
                    title="Add scene"
                    className="text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                    <Plus size={13} />
                </button>
            </div>
            {scenes.map((scene) => (
                <div key={scene.id} className="relative group">
                    <button
                        onClick={() => onActivate(scene.id)}
                        title={scene.hotkey ? `Hotkey: ${scene.hotkey}` : undefined}
                        className={`
              w-full px-4 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all duration-150
              flex items-center justify-between gap-2
              ${activeSceneId === scene.id
                            ? `${scene.color} text-white shadow-md`
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                        }
            `}
                    >
                        <span>{scene.name}</span>
                        {scene.hotkey && (
                            <span className="text-[10px] font-mono opacity-50">{scene.hotkey}</span>
                        )}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(scene);
                        }}
                        title="Edit scene"
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Pencil size={9} className="text-zinc-300" />
                    </button>
                </div>
            ))}
            {scenes.length === 0 && (
                <p className="text-[10px] text-zinc-600 italic">No scenes yet.</p>
            )}
        </div>
    );
};
