// src/services/geminiService.ts
import type { ImageData } from "../types";

/**
 * Sends original image (+ optional reference) and prompt to your Netlify function,
 * returns a base64 PNG string of the edited image.
 */
export async function editImageWithGemini(
  originalImage: ImageData,
  prompt: string,
  referenceImage: ImageData | null
): Promise<string> {
  const res = await fetch("/.netlify/functions/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalImage, prompt, referenceImage }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(errText || `Gemini function failed with ${res.status}`);
  }

  const { imageBase64 } = await res.json();
  if (!imageBase64) throw new Error("Empty response from Gemini");
  return imageBase64;
}


