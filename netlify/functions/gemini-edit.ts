import type { Handler } from "@netlify/functions";

// ⚠️ This function is designed to NEVER crash your build:
// - If GEMINI_API_KEY is missing, it simply returns the original image as a data URL.
// - When configured, you can wire your exact Gemini image-edit call inside the TODO.

export const handler: Handler = async (event) => {
    try {
        const { image, prompt } = JSON.parse(event.body || "{}") as {
            image?: { mime: string; base64: string };
            prompt?: string;
        };

        if (!image?.mime || !image?.base64) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing image { mime, base64 }" }) };
        }

        const apiKey = process.env.GEMINI_API_KEY;

        // If not configured yet, return original so the app keeps working
        if (!apiKey) {
            return {
                statusCode: 200,
                body: JSON.stringify({ dataUrl: `data:${image.mime};base64,${image.base64}` })
            };
        }

        // TODO: (Plug your working Gemini call here)
        // The exact endpoint for image-to-image editing may vary by model/version.
        // Example sketch using Generative Language API (multimodal) request:
        //
        // const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({
        //     contents: [{
        //       parts: [
        //         { inlineData: { mimeType: image.mime, data: image.base64 } },
        //         { text: `Apply these face styling instructions: ${prompt}` }
        //       ]
        //     }]
        //   })
        // });
        // if (!resp.ok) {
        //   const t = await resp.text();
        //   return { statusCode: 500, body: JSON.stringify({ error: "Gemini API failed", detail: t }) };
        // }
        // const json = await resp.json();
        // // You must extract the image data from json based on the model's response schema.
        // // Then return it as dataUrl:
        // return { statusCode: 200, body: JSON.stringify({ dataUrl: `data:${image.mime};base64,${OUTPUT_BASE64}` }) };

        // Temporary passthrough until you wire the exact Gemini image-output:
        return {
            statusCode: 200,
            body: JSON.stringify({ dataUrl: `data:${image.mime};base64,${image.base64}` })
        };
    } catch (e: any) {
        return { statusCode: 500, body: JSON.stringify({ error: e?.message ?? "Server error" }) };
    }
};
