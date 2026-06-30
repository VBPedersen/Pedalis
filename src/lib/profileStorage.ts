import {
    readDir,
    readTextFile,
    writeTextFile,
    mkdir,
    exists,
    remove,
    BaseDirectory
} from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import type { Profile } from "../types";

const PROFILES_DIR = "profiles"; // relative to $APPDATA
const LAST_PROFILE_KEY_FILE = "last_profile.json";

async function getProfilePath(profileName: string): Promise<string> {
    // Sanitize to a safe filename
    const safe = profileName.trim().replace(/[^a-zA-Z0-9 _-]/g, "").replace(/\s+/g, "_");
    const fileName = `${safe || "untitled"}.json`;
    return await join(PROFILES_DIR, fileName);
}

async function ensureProfilesDir() {
    try {
        // Force check/create the base container folder (AppData/Roaming/pedalis)
        // Passing "." tells Tauri to target the root of your AppData config directory
        const rootExists = await exists(".", { baseDir: BaseDirectory.AppData });
        if (!rootExists) {
            await mkdir(".", { baseDir: BaseDirectory.AppData, recursive: true });
        }

        // Now that the parent directory exists, create the "profiles" subdirectory
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
    try {
        const targetPath = await getProfilePath(profile.name);

        await writeTextFile(targetPath, JSON.stringify(profile, null, 2), {
            baseDir: BaseDirectory.AppData,
        });
    } catch (e) {
        alert(e)
        console.error("saveProfile failed:", e);
        throw e;
    }
}

/** Load a profile by name from disk. */
export async function loadProfile(name: string): Promise<Profile | null> {
    const path = await getProfilePath(name);
    try {
        const fileExists = await exists(path, { baseDir: BaseDirectory.AppData });
        if (!fileExists) return null;
        const text = await readTextFile(path, { baseDir: BaseDirectory.AppData });
        return JSON.parse(text) as Profile;
    } catch (e) {
        console.error("loadProfile failed:", e);
        alert(e)
        return null;
    }
}

/** Delete a profile file from disk. */
export async function deleteProfileFile(name: string): Promise<void> {
    const path = await getProfilePath(name);
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
