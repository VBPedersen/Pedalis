import React from "react";
import { X } from "lucide-react";

interface Props {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    width?: string;
}

export const Modal: React.FC<Props> = ({ title, onClose, children, width = "max-w-md" }) => {
    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className={`bg-zinc-900 border border-zinc-700 rounded-xl w-full ${width} mx-4 max-h-[85vh] overflow-y-auto shadow-2xl`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-900">
                    <h2 className="text-sm font-bold tracking-wide text-zinc-200">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-zinc-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
};