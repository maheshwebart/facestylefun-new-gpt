import React, { useState, ChangeEvent } from "react";
import type { ImageData } from "./types";

export function Studio({ onImageSelected }: { onImageSelected: (img: ImageData) => void }) {
    const [preview, setPreview] = useState<string | null>(null);

    const onFile = (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(",")[1] || "";
            onImageSelected({ mime: f.type, base64 });
            setPreview(dataUrl);
        };
        reader.readAsDataURL(f);
    };

    return (
        <div style={{ border: "1px solid #324", padding: 12, borderRadius: 8 }}>
            <label>
                <strong>Upload face photo:</strong>
                <input type="file" accept="image/*" onChange={onFile} style={{ display: "block", marginTop: 8 }} />
            </label>
            {preview && (
                <div style={{ marginTop: 12 }}>
                    <img src={preview} alt="preview" style={{ maxWidth: "100%", borderRadius: 8 }} />
                </div>
            )}
        </div>
    );
}
