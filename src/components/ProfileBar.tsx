import React, { useState } from "react";
import { useStore } from "../store/useStore";
import { Save, FolderOpen, Plus, Trash2, ChevronDown, Circle } from "lucide-react";

export const ProfileBar: React.FC = () => {
    const {
        profileName,
        availableProfiles,
        profileDirty,
        saveCurrentProfile,
        loadProfileByName,
        deleteProfile,
    } = useStore();

    const [showNewInput, setShowNewInput] = useState(false);
    const [newName, setNewName] = useState("");

    const handleSave = () => saveCurrentProfile();

    const handleSaveAs = () => {
        if (newName.trim()) {
            saveCurrentProfile(newName.trim());
            setNewName("");
            setShowNewInput(false);
        }
    };

    const handleDelete = () => {
        if (confirm(`Delete profile "${profileName}"? This cannot be undone.`)) {
            deleteProfile(profileName);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                Profile
                {profileDirty && (
                    <span title="Unsaved changes">
            <Circle size={6} className="fill-amber-400 text-amber-400" />
          </span>
                )}
            </p>

            {/* Profile selector dropdown */}
            <div className="relative">
                <select
                    value={profileName}
                    onChange={(e) => loadProfileByName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-2 appearance-none pr-8 focus:outline-none focus:border-zinc-500"
                >
                    {!availableProfiles.includes(profileName) && (
                        <option value={profileName}>{profileName} (unsaved)</option>
                    )}
                    {availableProfiles.map((p) => (
                        <option key={p} value={p}>
                            {p}
                        </option>
                    ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-2.5 text-zinc-500 pointer-events-none" />
            </div>

            {/* Action buttons */}
            <div className="flex gap-1.5">
                <button
                    onClick={handleSave}
                    title="Save current profile"
                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-1.5 transition-colors"
                >
                    <Save size={11} /> Save
                </button>
                <button
                    onClick={() => setShowNewInput((v) => !v)}
                    title="Save as new profile"
                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg py-1.5 transition-colors"
                >
                    <Plus size={11} /> New
                </button>
                <button
                    onClick={handleDelete}
                    title="Delete this profile"
                    className="flex items-center justify-center text-[10px] font-semibold bg-zinc-800 hover:bg-red-900/40 text-zinc-500 hover:text-red-400 rounded-lg py-1.5 px-2 transition-colors"
                >
                    <Trash2 size={11} />
                </button>
            </div>

            {showNewInput && (
                <div className="flex gap-1.5">
                    <input
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveAs()}
                        placeholder="Profile name..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-zinc-500"
                    />
                    <button
                        onClick={handleSaveAs}
                        className="text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3"
                    >
                        <FolderOpen size={11} />
                    </button>
                </div>
            )}
        </div>
    );
};