import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Stomp, Scene, HardwareStatus, MidiStatus, MidiMessage } from "../types";

// ─── Default Stomps (Neural DSP Archetype: John Mayer layout) ────────────────
//
// CHANNEL NOTE: Archetype's UI shows channels as 1-16. The MIDI wire protocol
// uses 0-15. So "Channel 1" in Archetype = channel: 0 here. Always subtract 1
// from whatever Archetype displays.
//
// CC NUMBERS: These must match what Archetype assigned during MIDI Learn.
// Right-click a pedal in Archetype → MIDI Learn → click the stomp button here.

const DEFAULT_STOMPS: Stomp[] = [
    {
        id: "boost",
        label: "Boost",
        color: "bg-yellow-500",
        // Archetype: CC #0, Channel 1 → channel: 0 here
        midiMessages: [{ type: "cc", channel: 0, cc: 0, value: 127 }],
        offMessages:  [{ type: "cc", channel: 0, cc: 0, value: 0 }],
        isActive: false,
        hotkey: "1",
    },
    {
        id: "od",
        label: "Drive",
        color: "bg-orange-500",
        // Assign next: MIDI Learn → cc: 1
        midiMessages: [{ type: "cc", channel: 0, cc: 1, value: 127 }],
        offMessages:  [{ type: "cc", channel: 0, cc: 1, value: 0 }],
        isActive: false,
        hotkey: "2",
    },
    {
        id: "chorus",
        label: "Chorus",
        color: "bg-sky-500",
        midiMessages: [{ type: "cc", channel: 0, cc: 2, value: 127 }],
        offMessages:  [{ type: "cc", channel: 0, cc: 2, value: 0 }],
        isActive: false,
        hotkey: "3",
    },
    {
        id: "delay",
        label: "Delay",
        color: "bg-violet-500",
        midiMessages: [{ type: "cc", channel: 0, cc: 3, value: 127 }],
        offMessages:  [{ type: "cc", channel: 0, cc: 3, value: 0 }],
        isActive: false,
        hotkey: "4",
    },
    {
        id: "reverb",
        label: "Reverb",
        color: "bg-emerald-500",
        midiMessages: [{ type: "cc", channel: 0, cc: 4, value: 127 }],
        offMessages:  [{ type: "cc", channel: 0, cc: 4, value: 0 }],
        isActive: false,
        hotkey: "5",
    },
];

const DEFAULT_SCENES: Scene[] = [
    {
        id: "clean",
        name: "Clean",
        color: "bg-sky-600",
        stomps: { comp: true, chorus: true, delay: false, reverb: true, od: false },
        hotkey: "F1",
    },
    {
        id: "crunch",
        name: "Crunch",
        color: "bg-orange-600",
        stomps: { comp: true, chorus: false, delay: false, reverb: false, od: true },
        hotkey: "F2",
    },
    {
        id: "lead",
        name: "Lead",
        color: "bg-red-600",
        stomps: { comp: true, chorus: false, delay: true, reverb: true, od: true },
        hotkey: "F3",
    },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface StoreState {
    stomps: Stomp[];
    scenes: Scene[];
    activeSceneId: string | null;
    midi: MidiStatus;
    hardware: HardwareStatus;
    midiChannel: number;

    // Actions
    toggleStomp: (id: string) => void;
    activateScene: (id: string) => void;
    setMidiConnected: (portName: string) => void;
    setMidiDisconnected: () => void;
    setHardwareConnected: (portName: string) => void;
    setHardwareDisconnected: () => void;
    setMidiChannel: (ch: number) => void;
    fireHardwareStomp: (switchNum: number) => void;
}

async function sendMessages(messages: MidiMessage[], channel: number) {
    for (const msg of messages) {
        try {
            if (msg.type === "cc") {
                await invoke("send_midi_cc", {
                    channel: msg.channel ?? channel,
                    cc: msg.cc,
                    value: msg.value,
                });
            } else if (msg.type === "pc") {
                await invoke("send_midi_pc", {
                    channel: msg.channel ?? channel,
                    program: msg.value,
                });
            }
        } catch (e) {
            console.error("MIDI send error:", e);
        }
    }
}

export const useStore = create<StoreState>((set, get) => ({
    stomps: DEFAULT_STOMPS,
    scenes: DEFAULT_SCENES,
    activeSceneId: null,
    midi: { connected: false, portName: null },
    hardware: { connected: false, portName: null },
    midiChannel: 0,

    toggleStomp: (id) => {
        const { stomps, midiChannel } = get();
        const stomp = stomps.find((s) => s.id === id);
        if (!stomp) return;

        const willBeActive = !stomp.isActive;
        const messages = willBeActive
            ? stomp.midiMessages
            : stomp.offMessages ?? stomp.midiMessages.map((m) => ({ ...m, value: 0 }));
        console.log(messages);
        sendMessages(messages, midiChannel);

        set((state) => ({
            stomps: state.stomps.map((s) =>
                s.id === id ? { ...s, isActive: willBeActive } : s
            ),
            activeSceneId: null, // custom override clears scene highlight
        }));
    },

    activateScene: (id) => {
        const { scenes, stomps, midiChannel } = get();
        const scene = scenes.find((s) => s.id === id);
        if (!scene) return;

        // Fire all MIDI messages needed to reach the desired state
        const newStomps = stomps.map((stomp) => {
            const desired = scene.stomps[stomp.id] ?? false;
            if (desired !== stomp.isActive) {
                const messages = desired
                    ? stomp.midiMessages
                    : stomp.offMessages ?? stomp.midiMessages.map((m) => ({ ...m, value: 0 }));
                sendMessages(messages, midiChannel);
            }
            return { ...stomp, isActive: scene.stomps[stomp.id] ?? false };
        });

        set({ stomps: newStomps, activeSceneId: id });
    },

    setMidiConnected: (portName) =>
        set({ midi: { connected: true, portName } }),
    setMidiDisconnected: () =>
        set({ midi: { connected: false, portName: null } }),
    setHardwareConnected: (portName) =>
        set({ hardware: { connected: true, portName } }),
    setHardwareDisconnected: () =>
        set({ hardware: { connected: false, portName: null } }),
    setMidiChannel: (ch) => set({ midiChannel: ch }),

    // Maps hardware switch numbers to stomp indices (1-based → index)
    fireHardwareStomp: (switchNum) => {
        const { stomps } = get();
        const stomp = stomps[switchNum - 1];
        if (stomp) get().toggleStomp(stomp.id);
    },
}));