import React, { useState } from "react";
import { Modal } from "./Modal";
import { useStore } from "../store/useStore";
import { COLOR_CHOICES } from "../lib/constants";
import type { Scene } from "../types";
import { Trash2 } from "lucide-react";

interface Props {
    scene: Scene;
    onClose: () => void;
}

export const SceneEditor: React.FC<Props> = ({ scene, onClose }) => {
    const { stomps, updateScene, removeScene } = useStore();
    const [name, setName] = useState(scene.name);
    const [color, setColor] = useState(scene.color);
    const [hotkey, setHotkey] = useState(scene.hotkey ?? "");
    const [stompStates, setStompStates] = useState<Record<string, boolean>>({
        ...scene.stomps,
    });

    const save = () => {
        updateScene(scene.id, {
            name: name.trim() || "Scene",
            color,
            hotkey: hotkey.trim() || undefined,
            stomps: stompStates,
        });
        onClose();
    };

    const handleDelete = () => {
        if (confirm(`Delete scene "${scene.name}"?`)) {
            removeScene(scene.id);
            onClose();
        }
    };

    return (
        <Modal title={`Edit Scene — ${scene.name}`} onClose={onClose} width="max-w-lg">
            <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                            Name
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                            Hotkey
                        </label>
                        <input
                            value={hotkey}
                            onChange={(e) => setHotkey(e.target.value)}
                            placeholder="e.g. F1"
                            className="mt-1 w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                        Color
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {COLOR_CHOICES.map((c) => (
                            <button
                                key={c.value}
                                onClick={() => setColor(c.value)}
                                title={c.label}
                                className={`w-7 h-7 rounded-full ${c.value} ${
                                    color === c.value ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Per-stomp toggle grid */}
                <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                        Stomp States
                    </label>
                    <div className="flex flex-col gap-1.5 mt-2">
                        {stomps.length === 0 && (
                            <p className="text-xs text-zinc-600">No stomps yet — add some first.</p>
                        )}
                        {stomps.map((stomp) => {
                            const active = stompStates[stomp.id] ?? false;
                            return (
                                <button
                                    key={stomp.id}
                                    onClick={() =>
                                        setStompStates((prev) => ({ ...prev, [stomp.id]: !active }))
                                    }
                                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                                >
                  <span className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className={`w-2.5 h-2.5 rounded-full ${stomp.color}`} />
                      {stomp.label}
                  </span>
                                    <span
                                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                            active ? "bg-emerald-600 text-white" : "bg-zinc-700 text-zinc-400"
                                        }`}
                                    >
                    {active ? "On" : "Off"}
                  </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                        <Trash2 size={14} /> Delete Scene
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={save}
                            className="px-4 py-2 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-semibold"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};