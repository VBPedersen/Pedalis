import type { Scene } from "../types";

interface Props {
    scenes: Scene[];
    activeSceneId: string | null;
    onActivate: (id: string) => void;
}

export const SceneSelector: React.FC<Props> = ({ scenes, activeSceneId, onActivate }) => {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">
                Scenes
            </p>
            {scenes.map((scene) => (
                <button
                    key={scene.id}
                    onClick={() => onActivate(scene.id)}
                    title={scene.hotkey ? `Hotkey: ${scene.hotkey}` : undefined}
                    className={`
            px-4 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all duration-150
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
            ))}
        </div>
    );
};