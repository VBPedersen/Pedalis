import { useEffect } from "react";
import { useStore } from "../store/useStore";

export function useHotkeys() {
    const { stomps, scenes, toggleStomp, activateScene } = useStore();

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Don't fire when typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLSelectElement
            )
                return;

            // Check stomps
            for (const stomp of stomps) {
                if (stomp.hotkey && e.key === stomp.hotkey) {
                    e.preventDefault();
                    toggleStomp(stomp.id);
                    return;
                }
            }

            // Check scenes (F1-F3 etc)
            for (const scene of scenes) {
                if (scene.hotkey && e.key === scene.hotkey) {
                    e.preventDefault();
                    activateScene(scene.id);
                    return;
                }
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [stomps, scenes, toggleStomp, activateScene]);
}
