import React, { useRef } from "react";
import type { ImageData } from "../types";

type Props = {
    value: string;
    onChange: (v: string) => void;
    reference: ImageData | null;
    onAttach: (img: ImageData | null) => void;
    onSubmit: () => void;
    disabled?: boolean;
};

export default function PromptBar({
    value, onChange, reference, onAttach, onSubmit, disabled
}: Props) {
    const fileRef = useRef<HTMLInputElement>(null);

    async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (!f) return;
        const base64 = await fileToB64(f);
        onAttach({ base64, mimeType: f.type });
        if (fileRef.current) fileRef.current.value = "";
    }

    return (
        <div className={`promptBar ${disabled ? "isDisabled" : ""}`}>
            <button
                className="iconBtn"
                title="Attach reference photo"
                aria-label="Attach reference photo"
                onClick={() => fileRef.current?.click()}
                disabled={disabled}
                type="button"
            >
                ↑
            </button>

            <input
                className="promptInput"
                placeholder="Type your style request… (attach a reference ↑)"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSubmit();
                    }
                }}
            />

            <button className="sendBtn" onClick={onSubmit} disabled={disabled} type="button">
                Apply
            </button>

            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />

            {reference && (
                <div className="attachChip" title="Reference attached">
                    <img src={`data:${reference.mimeType};base64,${reference.base64}`} alt="reference preview" />
                    <button className="chipX" onClick={() => onAttach(null)} type="button" aria-label="Remove reference" title="Remove">
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}

async function fileToB64(file: File): Promise<string> {
    const reader = new FileReader();
    return await new Promise((res, rej) => {
        reader.onloadend = () => res(String(reader.result).split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
    });
}
