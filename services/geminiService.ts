import { ImageData } from "../types";

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
    throw new Error(await res.text());
  }

  const { imageBase64 } = await res.json();
  if (!imageBase64) {
    throw new Error("Empty response from Gemini (no image returned)");
  }

  return imageBase64; // base64 image string
}
