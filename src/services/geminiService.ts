import type { ImageData } from "../types";

export async function editImageWithGemini(
  originalImage: ImageData,
  prompt: string,
  referenceImage: ImageData | null
): Promise<string> {
  const response = await fetch("/.netlify/functions/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalImage, prompt, referenceImage }),
  });

  const contentType = response.headers.get("content-type") || "";
  const bodyText = await response.text();

  if (!response.ok) throw new Error(bodyText || `Gemini function failed: ${response.status}`);
  if (!contentType.includes("application/json")) {
    throw new Error(`Unexpected response type: ${contentType}\n${bodyText.slice(0, 200)}`);
  }

  const { imageBase64 } = JSON.parse(bodyText);
  if (!imageBase64) throw new Error("Empty response from Gemini");
  return imageBase64;
}
