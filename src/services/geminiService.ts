import type { ImageData } from "../types";

export async function editImageWithGemini(image: ImageData, prompt: string): Promise<string> {
    const res = await fetch("/.netlify/functions/gemini-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, prompt })
    });
    if (!res.ok) {
        throw new Error(`Gemini edit failed: ${res.status}`);
    }
    const data = await res.json();
    // Expect: { dataUrl: "data:<mime>;base64,..." }
    return data.dataUrl as string;
}
