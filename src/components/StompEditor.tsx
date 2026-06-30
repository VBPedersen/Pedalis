import React, { useState } from "react";
import { Modal } from "./Modal";
import { useStore } from "../store/useStore";
import { COLOR_CHOICES } from "../lib/constants";
import type { MidiMessage, Stomp } from "../types";
import { Trash2, Plus } from "lucide-react";

interface Props {
    stomp: Stomp;
    onClose: () => void;
}

function MessageRow({
                        label,
                        msg,
                        onChange,
                        onRemove,
                    }: {
    label: string;
    msg: MidiMessage;
    onChange: (m: MidiMessage) => void;
    onRemove?: () => void;
}) {
    return (
        <div className="grid grid-cols-12 gap-2 items-center bg-zinc-800/50 rounded-lg px-2 py-1.5">
            <span className="col-span-2 text-[10px] text-zinc-500 uppercase">{label}</span>
            <select
                value={msg.type}
                onChange={(e) => onChange({ ...msg, type: e.target.value as "cc" | "pc" })}
                className="col-span-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-1.5 py-1"
            >
                <option value="cc">CC</option>
                <option value="pc">PC</option>
            </select>
            <div className="col-span-2 flex flex-col">
                <span className="text-[9px] text-zinc-600">Ch (1-16)</span>
                <input
                    type="number"
                    min={1}
                    max={16}
                    value={msg.channel + 1}
                    onChange={(e) =>
                        onChange({ ...msg, channel: Math.max(0, Math.min(15, Number(e.target.value) - 1)) })
                    }
                    className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-1.5 py-1 w-full"
                />
            </div>
            {msg.type === "cc" && (
                <div className="col-span-2 flex flex-col">
                    <span className="text-[9px] text-zinc-600">CC #</span>
                    <input
                        type="number"
                        min={0}
                        max={127}
                        value={msg.cc ?? 0}
                        onChange={(e) => onChange({ ...msg, cc: Number(e.target.value) })}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-1.5 py-1 w-full"
                    />
                </div>
            )}
            <div className={`${msg.type === "cc" ? "col-span-2" : "col-span-4"} flex flex-col`}>
                <span className="text-[9px] text-zinc-600">Value</span>
                <input
                    type="number"
                    min={0}
                    max={127}
                    value={msg.value}
                    onChange={(e) => onChange({ ...msg, value: Number(e.target.value) })}
                    className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-1.5 py-1 w-full"
                />
            </div>
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="col-span-2 flex justify-end text-zinc-600 hover:text-red-400 transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
}

export const StompEditor: React.FC<Props> = ({ stomp, onClose }) => {
    const { updateStomp, removeStomp } = useStore();
    const [label, setLabel] = useState(stomp.label);
    const [color, setColor] = useState(stomp.color);
    const [hotkey, setHotkey] = useState(stomp.hotkey ?? "");
    const [onMessages, setOnMessages] = useState<MidiMessage[]>(stomp.midiMessages);
    const [offMessages, setOffMessages] = useState<MidiMessage[]>(
        stomp.offMessages ?? stomp.midiMessages.map((m) => ({ ...m, value: 0 }))
    );

    const save = () => {
        updateStomp(stomp.id, {
            label: label.trim() || "Stomp",
            color,
            hotkey: hotkey.trim() || undefined,
            midiMessages: onMessages,
            offMessages: offMessages,
        });
        onClose();
    };

    const handleDelete = () => {
        if (confirm(`Delete "${stomp.label}"? This also removes it from any scenes.`)) {
            removeStomp(stomp.id);
            onClose();
        }
    };

    return (
        <Modal title={`Edit Stomp — ${stomp.label}`} onClose={onClose} width="max-w-xl">
            <div className="flex flex-col gap-5">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                            Label
                        </label>
                        <input
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
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
                            placeholder="e.g. 1, q, space"
                            className="mt-1 w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-2"
                        />
                    </div>
                </div>

                {/* Color picker */}
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

                {/* ON messages */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                            MIDI — On Press
                        </label>
                        <button
                            onClick={() =>
                                setOnMessages([...onMessages, { type: "cc", channel: 0, cc: 0, value: 127 }])
                            }
                            className="text-zinc-500 hover:text-zinc-200 flex items-center gap-1 text-[10px]"
                        >
                            <Plus size={12} /> Add
                        </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {onMessages.map((msg, i) => (
                            <MessageRow
                                key={i}
                                label={`#${i + 1}`}
                                msg={msg}
                                onChange={(m) => {
                                    const next = [...onMessages];
                                    next[i] = m;
                                    setOnMessages(next);
                                }}
                                onRemove={
                                    onMessages.length > 1
                                        ? () => setOnMessages(onMessages.filter((_, idx) => idx !== i))
                                        : undefined
                                }
                            />
                        ))}
                    </div>
                </div>

                {/* OFF messages */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                            MIDI — On Release / Off
                        </label>
                        <button
                            onClick={() =>
                                setOffMessages([...offMessages, { type: "cc", channel: 0, cc: 0, value: 0 }])
                            }
                            className="text-zinc-500 hover:text-zinc-200 flex items-center gap-1 text-[10px]"
                        >
                            <Plus size={12} /> Add
                        </button>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {offMessages.map((msg, i) => (
                            <MessageRow
                                key={i}
                                label={`#${i + 1}`}
                                msg={msg}
                                onChange={(m) => {
                                    const next = [...offMessages];
                                    next[i] = m;
                                    setOffMessages(next);
                                }}
                                onRemove={
                                    offMessages.length > 1
                                        ? () => setOffMessages(offMessages.filter((_, idx) => idx !== i))
                                        : undefined
                                }
                            />
                        ))}
                    </div>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                        <Trash2 size={14} /> Delete Stomp
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