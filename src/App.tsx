import "./App.css";
import { useStore } from "./store/useStore";
import { StompPedal } from "./components/StompPedal";
import { SceneSelector } from "./components/SceneSelector";
import { ConnectionPanel } from "./components/ConnectionPanel";
import { useHotkeys } from "./hooks/useHotkeys";
import { Guitar } from "lucide-react";

export default function App() {
  const { stomps, scenes, activeSceneId, toggleStomp, activateScene } = useStore();
  useHotkeys();

  return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col select-none">
        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800">
          <Guitar size={20} className="text-orange-400" />
          <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-zinc-200">
            Pedalis
          </h1>
          <span className="text-[10px] text-zinc-600 font-mono ml-1">v0.1</span>
        </header>

        {/* Main layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-48 border-r border-zinc-800 p-4 flex flex-col gap-6 overflow-y-auto">
            <SceneSelector
                scenes={scenes}
                activeSceneId={activeSceneId}
                onActivate={activateScene}
            />
            <div className="border-t border-zinc-800 pt-4">
              <ConnectionPanel />
            </div>
          </aside>

          {/* Pedalboard */}
          <main className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
            {/* Stage label */}
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">
              {activeSceneId
                  ? `Scene: ${scenes.find((s) => s.id === activeSceneId)?.name}`
                  : "Custom"}
            </div>

            {/* Stomps row */}
            <div className="flex gap-4 items-end">
              {stomps.map((stomp) => (
                  <StompPedal
                      key={stomp.id}
                      stomp={stomp}
                      onToggle={() => toggleStomp(stomp.id)}
                  />
              ))}
            </div>

            {/* Pedalboard surface decoration */}
            <div className="w-full max-w-xl h-4 rounded-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 opacity-60" />

            {/* Hotkey hint */}
            <p className="text-[10px] text-zinc-700 font-mono">
              Keys 1–5 toggle stomps · F1–F3 switch scenes
            </p>
          </main>
        </div>
      </div>
  );
}

