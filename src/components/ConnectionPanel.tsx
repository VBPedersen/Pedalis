import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useStore } from "../store/useStore";
import { Usb, Music, ChevronDown, Check } from "lucide-react";
import {useEffect, useState} from "react";

export const ConnectionPanel: React.FC = () => {
    const [midiPorts, setMidiPorts] = useState<string[]>([]);
    const [serialPorts, setSerialPorts] = useState<string[]>([]);
    const { midi, hardware, setMidiConnected, setHardwareConnected, fireHardwareStomp } =
        useStore();

    useEffect(() => {
        // Load available ports
        invoke<string[]>("list_midi_ports").then(setMidiPorts).catch(console.error);
        invoke<string[]>("list_serial_ports").then(setSerialPorts).catch(console.error);
    }, []);

    useEffect(() => {
        // Listen for hardware stomp events from Rust serial listener
        const unlisten = listen<number>("hardware-stomp", (event) => {
            fireHardwareStomp(event.payload);
        });

        // Listen for expression pedal — stored globally for CC routing
        const unlistenExp = listen<number>("hardware-exp", (event) => {
            invoke("send_midi_cc", { channel: 0, cc: 11, value: event.payload }).catch(
                console.error
            );
        });

        return () => {
            unlisten.then((fn) => fn());
            unlistenExp.then((fn) => fn());
        };
    }, [fireHardwareStomp]);

    const connectMidi = async (portName: string) => {
        try {
            await invoke("connect_midi_port", { portName });
            setMidiConnected(portName);
        } catch (e) {
            console.error("MIDI connect failed:", e);
        }
    };

    const connectSerial = async (portName: string) => {
        try {
            await invoke("connect_serial_port", { portName, baudRate: 115200 });
            setHardwareConnected(portName);
        } catch (e) {
            console.error("Serial connect failed:", e);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* MIDI Port */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Music size={14} className="text-zinc-400" />
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                        MIDI Output
                    </p>
                    {midi.connected && <Check size={12} className="text-emerald-400 ml-auto" />}
                </div>
                <div className="relative">
                    <select
                        onChange={(e) => connectMidi(e.target.value)}
                        value={midi.portName ?? ""}
                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 appearance-none pr-8 focus:outline-none focus:border-zinc-500"
                    >
                        <option value="" disabled>
                            — Select MIDI port —
                        </option>
                        {midiPorts.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-2.5 text-zinc-500 pointer-events-none" />
                </div>
                {midi.connected && (
                    <p className="text-[10px] text-emerald-400 mt-1">
                        ● {midi.portName}
                    </p>
                )}
            </div>

            {/* Serial / Hardware Port */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Usb size={14} className="text-zinc-400" />
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                        Hardware (USB)
                    </p>
                    {hardware.connected && <Check size={12} className="text-emerald-400 ml-auto" />}
                </div>
                <div className="relative">
                    <select
                        onChange={(e) => connectSerial(e.target.value)}
                        value={hardware.portName ?? ""}
                        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 appearance-none pr-8 focus:outline-none focus:border-zinc-500"
                    >
                        <option value="" disabled>
                            — Select COM port —
                        </option>
                        {serialPorts.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-2.5 text-zinc-500 pointer-events-none" />
                </div>
                {hardware.connected && (
                    <p className="text-[10px] text-emerald-400 mt-1">
                        ● {hardware.portName}
                    </p>
                )}
            </div>
        </div>
    );
};
