import "./App.css";
import { useEffect, useState } from "react";
import { useStore } from "./store/useStore";
import { StompPedal } from "./components/StompPedal";
import { SceneSelector } from "./components/SceneSelector";
import { ConnectionPanel } from "./components/ConnectionPanel";
import { ProfileBar } from "./components/ProfileBar";
import { StompEditor } from "./components/StompEditor";
import { SceneEditor } from "./components/SceneEditor";
import { useHotkeys } from "./hooks/useHotkeys";
import { Guitar, Plus } from "lucide-react";
import type { Stomp, Scene } from "./types";

export default function App() {
  const {
    stomps,
    scenes,
    activeSceneId,
    toggleStomp,
    activateScene,
    addStomp,
    addScene,
    initProfiles,
    profileLoading,
  } = useStore();

  useHotkeys();

  const [editingStomp, setEditingStomp] = useState<Stomp | null>(null);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);

  // Keep modal data fresh if the underlying store updates while it's open
  useEffect(() => {
    if (editingStomp) {
      const fresh = stomps.find((s) => s.id === editingStomp.id);
      if (!fresh) setEditingStomp(null); // was deleted
    }
  }, [stomps]);

  useEffect(() => {
    if (editingScene) {
      const fresh = scenes.find((s) => s.id === editingScene.id);
      if (!fresh) setEditingScene(null); // was deleted
    }
  }, [scenes]);

  // Load last-used profile (or seed defaults) on first mount
  useEffect(() => {
    initProfiles();
  }, []);

  if (profileLoading) {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-500 flex items-center justify-center text-sm">
          Loading profile…
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col select-none">
        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800">
          <Guitar size={20} className="text-orange-400" />
          <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-zinc-200">
            Pedalis
          </h1>
          <span className="text-[10px] text-zinc-600 font-mono ml-1">v0.2</span>
        </header>

        {/* Main layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-52 border-r border-zinc-800 p-4 flex flex-col gap-6 overflow-y-auto">
            <ProfileBar />

            <div className="border-t border-zinc-800 pt-4">
              <SceneSelector
                  scenes={scenes}
                  activeSceneId={activeSceneId}
                  onActivate={activateScene}
                  onEdit={setEditingScene}
                  onAdd={addScene}
              />
            </div>

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
            <div className="flex gap-4 items-end flex-wrap justify-center">
              {stomps.map((stomp) => (
                  <StompPedal
                      key={stomp.id}
                      stomp={stomp}
                      onToggle={() => toggleStomp(stomp.id)}
                      onEdit={() => setEditingStomp(stomp)}
                  />
              ))}

              {/* Add stomp tile */}
              <button
                  onClick={addStomp}
                  title="Add stomp"
                  className="w-24 h-32 rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <Plus size={20} />
                <span className="text-[10px] uppercase tracking-widest font-semibold">
                Add
              </span>
              </button>
            </div>

            {/* Pedalboard surface decoration */}
            <div className="w-full max-w-xl h-4 rounded-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 opacity-60" />

            {/* Hotkey hint */}
            <p className="text-[10px] text-zinc-700 font-mono">
              Hover a pedal/scene to edit · click + to add new
            </p>
          </main>
        </div>

        {/* Modals */}
        {editingStomp && (
            <StompEditor stomp={editingStomp} onClose={() => setEditingStomp(null)} />
        )}
        {editingScene && (
            <SceneEditor scene={editingScene} onClose={() => setEditingScene(null)} />
        )}
      </div>
  );
}
