export default async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) return new Response("Server misconfig: GEMINI_API_KEY not set", { status: 500 });

    const { prompt, originalImage, referenceImage } = await req.json();
    if (!originalImage?.base64 || !originalImage?.mimeType) {
      return new Response("Missing original image", { status: 400 });
    }

    const parts = [{
      inlineData: { data: originalImage.base64, mimeType: originalImage.mimeType }
    }];

    if (referenceImage?.base64 && referenceImage?.mimeType) {
      parts.push({ inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType } });
    }
    if (prompt) parts.push({ text: String(prompt) });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${encodeURIComponent(API_KEY)}`;

    const body = { contents: [{ parts }], generationConfig: { temperature: 0.7, topP: 0.9, topK: 32, maxOutputTokens: 512 } };

    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(body) });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return new Response(`Gemini error ${r.status}: ${t.slice(0, 400)}`, { status: 502 });
    }

    const data = await r.json();
    let imageBase64 = null;
    const partsOut = data?.candidates?.[0]?.content?.parts ?? [];
    for (const p of partsOut) {
      if (p.inlineData?.data) { imageBase64 = p.inlineData.data; break; }
    }
    if (!imageBase64) return new Response("No image returned by Gemini", { status: 500 });

    return new Response(JSON.stringify({ ok: true, imageBase64 }), { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (e) {
    return new Response(`Function error: ${e?.message ?? e}`, { status: 500 });
  }
};
