// Netlify Function: /.netlify/functions/gemini
export default async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return new Response("Server misconfig: GEMINI_API_KEY not set", { status: 500 });
    }

    const { prompt, model = "gemini-1.5-flash", gen = {} } = await req.json();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(API_KEY)}`;
    const body = {
      contents: [{ role: "user", parts: [{ text: String(prompt ?? "") }] }],
      generationConfig: {
        temperature: gen.temperature ?? 0.7,
        topP: gen.topP ?? 0.9,
        topK: gen.topK ?? 32,
        maxOutputTokens: gen.maxOutputTokens ?? 512,
      },
      // Optional: tighten safety settings on server if you want
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return new Response(`Gemini error ${r.status}: ${t.slice(0,400)}`, { status: 502 });
    }

    const data = await r.json();
    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // tighten to your domain in production
      },
    });
  } catch (e) {
    return new Response(`Function error: ${e?.message ?? e}`, { status: 500 });
  }
};
