import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useStore } from "../store/useStore";
import { Usb, Music, ChevronDown, Check, RefreshCw, AlertCircle } from "lucide-react";

export const ConnectionPanel: React.FC = () => {
    const [midiPorts, setMidiPorts] = useState<string[]>([]);
    const [serialPorts, setSerialPorts] = useState<string[]>([]);
    const [midiError, setMidiError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const { midi, hardware, setMidiConnected, setHardwareConnected, fireHardwareStomp } =
        useStore();

    //  Track the current rotation degree counter
    const [spinDeg, setSpinDeg] = useState(0);

    const loadPorts = async () => {
        setRefreshing(true);
        setMidiError(null);

        // Instantly spin the icon 360 degrees forward on click
        setSpinDeg(prev => prev + 360);

        await Promise.all([
            (async () => {
                try {
                    const ports = await invoke<string[]>("list_midi_ports");
                    setMidiPorts(ports);
                    if (ports.length === 0) {
                        setMidiError("No MIDI ports found. Is loopMIDI running?");
                    }
                } catch (e) {
                    setMidiError(String(e));
                }
            })(),
            (async () => {
                try {
                    const ports = await invoke<string[]>("list_serial_ports");
                    setSerialPorts(ports);
                } catch (e) {
                    console.error("Failed to list serial ports:", e);
                }
            })()
        ]);

        setRefreshing(false);
    };

    useEffect(() => {
        // Initial silent load without triggering a wild visual spin on app start
        invoke<string[]>("list_midi_ports").then(setMidiPorts).catch(() => {});
        invoke<string[]>("list_serial_ports").then(setSerialPorts).catch(() => {});
    }, []);

    useEffect(() => {
        const unlisten = listen<number>("hardware-stomp", (event) => {
            fireHardwareStomp(event.payload);
        });

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
                    <button
                        onClick={loadPorts}
                        disabled={refreshing}
                        title="Refresh ports"
                        className="ml-auto text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {/*  Explicitly driving rotation strictly by inline style transitions */}
                        <RefreshCw
                            size={11}
                            style={{ transform: `rotate(${spinDeg}deg)` }}
                            className={`transform will-change-transform transition-transform duration-700 ease-in-out ${
                                refreshing ? "text-emerald-400" : ""
                            }`}
                        />
                    </button>
                    {midi.connected && <Check size={12} className="text-emerald-400" />}
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
                {midiError && !midi.connected && (
                    <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> {midiError}
                    </p>
                )}
                {midi.connected && (
                    <p className="text-[10px] text-emerald-400 mt-1">● {midi.portName}</p>
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
