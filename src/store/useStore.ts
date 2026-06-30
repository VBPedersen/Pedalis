import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Stomp, Scene, HardwareStatus, MidiStatus, MidiMessage, Profile } from "../types";
import { genId, DEFAULT_PROFILE_NAME } from "../lib/constants";
import {
    listProfiles,
    saveProfile,
    loadProfile,
    deleteProfileFile,
    saveLastProfileName,
    loadLastProfileName,
} from "../lib/profileStorage";

// ─── Default Stomps (Neural DSP Archetype: John Mayer layout) ────────────────
//
// CHANNEL NOTE: Archetype's UI shows channels as 1-16. The MIDI wire protocol
// uses 0-15. So "Channel 1" in Archetype = channel: 0 here. Always subtract 1
// from whatever Archetype displays.
//
// CC NUMBERS: These must match what Archetype assigned during MIDI Learn.
// Right-click a pedal in Archetype → MIDI Learn → click the stomp button here.
// You can now also edit these directly in-app via the pedal's edit icon.

const DEFAULT_STOMPS: Stomp[] = [
    {
        id: "boost",
        label: "Boost",
        color: "bg-yellow-500",
        midiMessages: [{ type: "cc", channel: 0, cc: 0, value: 127 }],
        offMessages:  [{ type: "cc", channel: 0, cc: 0, value: 0 }],
        isActive: false,
        hotkey: "1",
    },
    {
        id: "od",
        label: "Drive",
        color: "bg-orange-500",
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
        stomps: { boost: true, chorus: true, delay: false, reverb: true, od: false },
        hotkey: "F1",
    },
    {
        id: "crunch",
        name: "Crunch",
        color: "bg-orange-600",
        stomps: { boost: true, chorus: false, delay: false, reverb: false, od: true },
        hotkey: "F2",
    },
    {
        id: "lead",
        name: "Lead",
        color: "bg-red-600",
        stomps: { boost: true, chorus: false, delay: true, reverb: true, od: true },
        hotkey: "F3",
    },
];

const DEFAULT_PROFILE: Profile = {
    name: DEFAULT_PROFILE_NAME,
    stomps: DEFAULT_STOMPS,
    scenes: DEFAULT_SCENES,
    activeSceneId: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface StoreState {
    stomps: Stomp[];
    scenes: Scene[];
    activeSceneId: string | null;
    midi: MidiStatus;
    hardware: HardwareStatus;
    midiChannel: number;

    // Profile management
    profileName: string;
    availableProfiles: string[];
    profileDirty: boolean; // unsaved changes flag
    profileLoading: boolean;

    // Stomp actions
    toggleStomp: (id: string) => void;
    addStomp: () => void;
    removeStomp: (id: string) => void;
    updateStomp: (id: string, patch: Partial<Stomp>) => void;
    reorderStomps: (fromIndex: number, toIndex: number) => void;

    // Scene actions
    activateScene: (id: string) => void;
    addScene: () => void;
    removeScene: (id: string) => void;
    updateScene: (id: string, patch: Partial<Scene>) => void;
    setSceneStompState: (sceneId: string, stompId: string, active: boolean) => void;

    // Connection actions
    setMidiConnected: (portName: string) => void;
    setMidiDisconnected: () => void;
    setHardwareConnected: (portName: string) => void;
    setHardwareDisconnected: () => void;
    setMidiChannel: (ch: number) => void;
    fireHardwareStomp: (switchNum: number) => void;

    // Profile actions
    refreshProfileList: () => Promise<void>;
    saveCurrentProfile: (asName?: string) => Promise<void>;
    loadProfileByName: (name: string) => Promise<void>;
    deleteProfile: (name: string) => Promise<void>;
    initProfiles: () => Promise<void>;
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

const sanitizeName = (name: string) =>
    name.trim().replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "_") || "untitled";

export const useStore = create<StoreState>((set, get) => ({
    stomps: DEFAULT_STOMPS,
    scenes: DEFAULT_SCENES,
    activeSceneId: null,
    midi: { connected: false, portName: null },
    hardware: { connected: false, portName: null },
    midiChannel: 0,

    profileName: DEFAULT_PROFILE_NAME,
    availableProfiles: [],
    profileDirty: false,
    profileLoading: false,

    // ─── Stomp toggling (fires MIDI) ───────────────────────────────────────────

    toggleStomp: (id) => {
        const { stomps, midiChannel } = get();
        const stomp = stomps.find((s) => s.id === id);
        if (!stomp) return;

        const willBeActive = !stomp.isActive;
        const messages = willBeActive
            ? stomp.midiMessages
            : stomp.offMessages ?? stomp.midiMessages.map((m) => ({ ...m, value: 0 }));

        sendMessages(messages, midiChannel);

        set((state) => ({
            stomps: state.stomps.map((s) =>
                s.id === id ? { ...s, isActive: willBeActive } : s
            ),
            activeSceneId: null,
        }));
    },

    // ─── Stomp CRUD ─────────────────────────────────────────────────────────────

    addStomp: () => {
        const { stomps } = get();
        const nextCc = stomps.length; // simple auto-increment guess; user can edit
        const newStomp: Stomp = {
            id: genId("stomp"),
            label: "New Stomp",
            color: "bg-zinc-500",
            midiMessages: [{ type: "cc", channel: 0, cc: nextCc, value: 127 }],
            offMessages: [{ type: "cc", channel: 0, cc: nextCc, value: 0 }],
            isActive: false,
        };
        set({ stomps: [...stomps, newStomp], profileDirty: true });
    },

    removeStomp: (id) => {
        set((state) => ({
            stomps: state.stomps.filter((s) => s.id !== id),
            // Also strip this stomp from every scene's mapping
            scenes: state.scenes.map((sc) => {
                const { [id]: _, ...rest } = sc.stomps;
                return { ...sc, stomps: rest };
            }),
            profileDirty: true,
        }));
    },

    updateStomp: (id, patch) => {
        set((state) => ({
            stomps: state.stomps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
            profileDirty: true,
        }));
    },

    reorderStomps: (fromIndex, toIndex) => {
        set((state) => {
            const next = [...state.stomps];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return { stomps: next, profileDirty: true };
        });
    },

    // ─── Scene activation + CRUD ────────────────────────────────────────────────

    activateScene: (id) => {
        const { scenes, stomps, midiChannel } = get();
        const scene = scenes.find((s) => s.id === id);
        if (!scene) return;

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

    addScene: () => {
        const { scenes, stomps } = get();
        // default new scene to "all off"
        const allOff: Record<string, boolean> = {};
        stomps.forEach((s) => (allOff[s.id] = false));
        const newScene: Scene = {
            id: genId("scene"),
            name: "New Scene",
            color: "bg-zinc-600",
            stomps: allOff,
        };
        set({ scenes: [...scenes, newScene], profileDirty: true });
    },

    removeScene: (id) => {
        set((state) => ({
            scenes: state.scenes.filter((s) => s.id !== id),
            activeSceneId: state.activeSceneId === id ? null : state.activeSceneId,
            profileDirty: true,
        }));
    },

    updateScene: (id, patch) => {
        set((state) => ({
            scenes: state.scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
            profileDirty: true,
        }));
    },

    setSceneStompState: (sceneId, stompId, active) => {
        set((state) => ({
            scenes: state.scenes.map((s) =>
                s.id === sceneId
                    ? { ...s, stomps: { ...s.stomps, [stompId]: active } }
                    : s
            ),
            profileDirty: true,
        }));
    },

    // ─── Connections ────────────────────────────────────────────────────────────

    setMidiConnected: (portName) => set({ midi: { connected: true, portName } }),
    setMidiDisconnected: () => set({ midi: { connected: false, portName: null } }),
    setHardwareConnected: (portName) => set({ hardware: { connected: true, portName } }),
    setHardwareDisconnected: () => set({ hardware: { connected: false, portName: null } }),
    setMidiChannel: (ch) => set({ midiChannel: ch }),

    fireHardwareStomp: (switchNum) => {
        const { stomps } = get();
        const stomp = stomps[switchNum - 1];
        if (stomp) get().toggleStomp(stomp.id);
    },

    // ─── Profile management ─────────────────────────────────────────────────────

    refreshProfileList: async () => {
        const names = await listProfiles();
        set({ availableProfiles: names });
    },

    saveCurrentProfile: async (newName) => {
        const { stomps, scenes, activeSceneId, profileName } = get();

        // Determine target name
        const rawTargetName = newName ? newName.trim() : profileName;
        const targetName = sanitizeName(rawTargetName);
        let profileToSave: Profile;

        if (newName) {
            // User clicked "New"!
            // Force scenes and stomp pedals to empty arrays for a fresh slate
            profileToSave = {
                name: targetName,
                stomps: [],       // Empty out stomp pedals
                scenes: [],       // Empty out scenes
                activeSceneId: null
            };
        } else {
            // Saving the active profile normally: keep active items
            profileToSave = {
                name: targetName,
                stomps,
                scenes,
                activeSceneId
            };
        }

        try {
            // Save using our updated file system layer
            await saveProfile(profileToSave);
            await saveLastProfileName(targetName);

            // Update local zustand state reactively
            set({
                profileName: targetName,
                profileDirty: false,
                // If it was a new profile creation, update active viewport array states to clear board
                ...(newName && { stomps: [], scenes: [], activeSceneId: null })
            });

            // Refresh dropdown choices
            await get().refreshProfileList();
        } catch (error) {
            console.error("Failed to save profile:", error);
        }
    },

    loadProfileByName: async (name) => {
        set({ profileLoading: true });
        try {
            const sanitizedTarget = sanitizeName(name);
            const profile = await loadProfile(sanitizedTarget);
            if (profile) {
                set({
                    // Fall back to empty arrays if a brand new empty profile layout is loaded
                    stomps: profile.stomps || [],
                    scenes: profile.scenes || [],
                    profileName: sanitizedTarget,
                    activeSceneId: null,
                    profileDirty: false,
                    profileLoading: false,
                });
                await saveLastProfileName(sanitizedTarget);
            } else {
                set({ profileLoading: false });
            }
        } catch (error) {
            console.error("Failed to load profile:", error);
            set({ profileLoading: false });
            alert(error);
        }
    },

    deleteProfile: async (name) => {
        await deleteProfileFile(name);
        await get().refreshProfileList();
        // If we just deleted the active profile, fall back to defaults
        if (get().profileName === name) {
            set({
                stomps: DEFAULT_STOMPS,
                scenes: DEFAULT_SCENES,
                profileName: DEFAULT_PROFILE_NAME,
                profileDirty: false,
            });
        }
    },

    initProfiles: async () => {
        set({ profileLoading: true });
        try {
            await get().refreshProfileList();
            const { availableProfiles } = get();

            if (availableProfiles.length === 0) {
                // First run: seed disk with the default profile
                const defaultName = sanitizeName(DEFAULT_PROFILE_NAME);
                const initialProfile = { ...DEFAULT_PROFILE, name: defaultName };

                await saveProfile(initialProfile);
                await get().refreshProfileList();
                await get().loadProfileByName(defaultName);
                set({ profileLoading: false });
                return;
            }

            const lastProfileName = await loadLastProfileName();
            const target =
                lastProfileName && availableProfiles.includes(sanitizeName(lastProfileName))
                    ? sanitizeName(lastProfileName)
                    : availableProfiles[0];

            await get().loadProfileByName(target);
        } catch (error) {
            console.error("Critical error in initialization loop:", error);
            //  Fallback safety valve: Unfreeze app layout even if the file failed to write
            set({ profileLoading: false });
        }
    },
}));
