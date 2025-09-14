import React, { useState, FormEvent } from "react";

export default function PromptBar({ onSubmit }: { onSubmit: (prompt: string) => void }) {
    const [prompt, setPrompt] = useState("");

    const handle = (e: FormEvent) => {
        e.preventDefault();
        onSubmit(prompt.trim());
    };

    return (
        <form onSubmit={handle} style={{ display: "flex", gap: 8 }}>
            <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the style: e.g., 'Long wavy hairstyle with short beard and thin metal glasses'"
                style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #304050" }}
            />
            <button type="submit" style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #304050", cursor: "pointer" }}>
                Apply Style
            </button>
        </form>
    );
}
