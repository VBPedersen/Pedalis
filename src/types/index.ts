
export type Profile = {
    name: string;
    stomps: Stomp[];
    scenes: Scene[];
};

export type MidiMessage = {
    type: "cc" | "pc";
    channel: number; // 0-15
    cc?: number;     // for CC messages
    value: number;   // 0-127
};

export type Stomp = {
    id: string;
    label: string;
    color: string;      // Tailwind color class e.g. "bg-orange-500"
    icon?: string;      // icon name from lucide
    midiMessages: MidiMessage[];  // messages fired when this stomp toggles ON
    offMessages?: MidiMessage[];  // messages when toggling OFF
    isActive: boolean;
    hotkey?: string;    // e.g. "1", "q", " "
};

export type Scene = {
    id: string;
    name: string;
    color: string;
    stomps: Record<string, boolean>; // stompId -> desired active state
    hotkey?: string;
};

export type HardwareStatus = {
    connected: boolean;
    portName: string | null;
};

export type MidiStatus = {
    connected: boolean;
    portName: string | null;
};
