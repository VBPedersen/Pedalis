import {
    readDir,
    readTextFile,
    writeTextFile,
    mkdir,
    exists,
    remove,
} from "@tauri-apps/plugin-fs";
import { BaseDirectory } from "@tauri-apps/api/path";
import type { Profile } from "../types";

const PROFILES_DIR = "profiles"; // relative to $APPDATA
const LAST_PROFILE_KEY_FILE = "last_profile.json";

function fileNameFor(profileName: string): string {
    // Sanitize to a safe filename
    const safe = profileName.trim().replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "_");
    return `${PROFILES_DIR}/${safe || "untitled"}.json`;
}

async function ensureProfilesDir() {
    try {
        const dirExists = await exists(PROFILES_DIR, { baseDir: BaseDirectory.AppData });
        if (!dirExists) {
            await mkdir(PROFILES_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
        }
    } catch (e) {
        console.error("ensureProfilesDir failed:", e);
    }
}

/** List all saved profile names (derived from filenames). */
export async function listProfiles(): Promise<string[]> {
    await ensureProfilesDir();
    try {
        const entries = await readDir(PROFILES_DIR, { baseDir: BaseDirectory.AppData });
        return entries
            .filter((e) => e.isFile && e.name?.endsWith(".json"))
            .map((e) => e.name!.replace(/\.json$/, ""));
    } catch (e) {
        console.error("listProfiles failed:", e);
        return [];
    }
}

/** Save a profile to disk as JSON. */
export async function saveProfile(profile: Profile): Promise<void> {
    await ensureProfilesDir();
    const path = fileNameFor(profile.name);
    try {
        await writeTextFile(path, JSON.stringify(profile, null, 2), {
            baseDir: BaseDirectory.AppData,
        });
    } catch (e) {
        console.error("saveProfile failed:", e);
    }
}

/** Load a profile by name from disk. */
export async function loadProfile(name: string): Promise<Profile | null> {
    const path = fileNameFor(name);
    try {
        const fileExists = await exists(path, { baseDir: BaseDirectory.AppData });
        if (!fileExists) return null;
        const text = await readTextFile(path, { baseDir: BaseDirectory.AppData });
        return JSON.parse(text) as Profile;
    } catch (e) {
        console.error("loadProfile failed:", e);
        return null;
    }
}

/** Delete a profile file from disk. */
export async function deleteProfileFile(name: string): Promise<void> {
    const path = fileNameFor(name);
    try {
        const fileExists = await exists(path, { baseDir: BaseDirectory.AppData });
        if (fileExists) {
            await remove(path, { baseDir: BaseDirectory.AppData });
        }
    } catch (e) {
        console.error("deleteProfileFile failed:", e);
    }
}

/** Remember which profile was last active, so app reopens to the same one. */
export async function saveLastProfileName(name: string): Promise<void> {
    await ensureProfilesDir();
    const path = `${PROFILES_DIR}/${LAST_PROFILE_KEY_FILE}`;
    try {
        await writeTextFile(
            path,
            JSON.stringify({ lastProfile: name }),
            { baseDir: BaseDirectory.AppData }
        );
    } catch (e) {
        console.error("saveLastProfileName failed:", e);
    }
}

export async function loadLastProfileName(): Promise<string | null> {
    const path = `${PROFILES_DIR}/${LAST_PROFILE_KEY_FILE}`;
    try {
        const fileExists = await exists(path, { baseDir: BaseDirectory.AppData });
        if (!fileExists) return null;
        const text = await readTextFile(path, { baseDir: BaseDirectory.AppData });
        const data = JSON.parse(text);
        return data?.lastProfile ?? null;
    } catch (e) {
        console.error("loadLastProfileName failed:", e);
        return null;
    }
}
