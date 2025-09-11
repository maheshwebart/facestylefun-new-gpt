import type { ImageData } from "../types";

export async function editImageWithGemini(
  originalImage: ImageData,
  prompt: string,
  referenceImage: ImageData | null
): Promise<string> {
  // Call via /api/* which proxies to Netlify Functions (see netlify.toml)
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalImage, prompt, referenceImage }),
  });

  const contentType = response.headers.get("content-type") || "";
  const bodyText = await response.text();

  if (!response.ok) {
    // Server returned an error; surface its text
    throw new Error(bodyText || `Gemini function failed with ${response.status}`);
  }

  if (!contentType.includes("application/json")) {
    // Got HTML (likely SPA redirect) or other non-JSON
    throw new Error(`Unexpected response type: ${contentType}\n${bodyText.slice(0, 200)}`);
  }

  const { imageBase64 } = JSON.parse(bodyText);
  if (!imageBase64) throw new Error("Empty response from Gemini");
  return imageBase64;
}
