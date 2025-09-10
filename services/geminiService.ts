// Client-side service that calls the Netlify serverless function (no API key in browser)
import { ImageData } from "../types";

export async function generateText(prompt: string): Promise<string> {
  const res = await fetch("/.netlify/functions/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  const { data } = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) {
    throw new Error("Empty response from Gemini");
  }
  return text.trim();
}

// Example image transform call signature if needed later.
// For now, keep the type import to avoid breaking other imports.
export async function generateStyleIdeas(faceShape: string): Promise<string[]> {
  const out = await generateText(`Give me 5 hairstyle ideas for a person with a ${faceShape} face shape. Return as a simple list.`);
  return out.split(/\n+/).map(s => s.replace(/^[-*\d.\s]+/, '')).filter(Boolean);
}
