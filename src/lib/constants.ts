// Curated Tailwind color set safe for both stomps and scenes
export const COLOR_CHOICES: { label: string; value: string }[] = [
    { label: "Yellow", value: "bg-yellow-500" },
    { label: "Orange", value: "bg-orange-500" },
    { label: "Red", value: "bg-red-500" },
    { label: "Rose", value: "bg-rose-500" },
    { label: "Pink", value: "bg-pink-500" },
    { label: "Violet", value: "bg-violet-500" },
    { label: "Indigo", value: "bg-indigo-500" },
    { label: "Sky", value: "bg-sky-500" },
    { label: "Cyan", value: "bg-cyan-500" },
    { label: "Emerald", value: "bg-emerald-500" },
    { label: "Lime", value: "bg-lime-500" },
    { label: "Zinc", value: "bg-zinc-500" },
];

export function genId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export const DEFAULT_PROFILE_NAME = "Default";
