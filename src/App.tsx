import React, { useState } from "react";
import { Studio } from "./Studio";
import PromptBar from "./components/PromptBar";
import type { ImageData } from "./types";
import { editImageWithGemini } from "./services/geminiService";
import PayPalBuy from "./components/PayPalBuy";

export default function App() {
    const [image, setImage] = useState<ImageData | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const apply = async (prompt: string) => {
        if (!image) { setErr("Please upload a face image first."); return; }
        setErr(null);
        setLoading(true);
        try {
            const out = await editImageWithGemini(image, prompt);
            setResult(out);
        } catch (e: any) {
            setErr(e?.message ?? "Failed to apply style.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 20, display: "grid", gap: 16 }}>
            <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h1 style={{ margin: 0 }}>FaceStyleFun</h1>
            </header>

            <section style={{ display: "grid", gap: 12 }}>
                <Studio onImageSelected={setImage} />
                <PromptBar onSubmit={apply} />
                {loading && <div>Applying style…</div>}
                {err && <div style={{ color: "#ff7b7b" }}>{err}</div>}
                {result && (
                    <div style={{ marginTop: 8 }}>
                        <h3>Styled Result</h3>
                        <img src={result} alt="Styled" style={{ maxWidth: "100%", borderRadius: 8 }} />
                    </div>
                )}
            </section>

            <section style={{ display: "grid", gap: 8 }}>
                <h3>Buy Credits (Optional)</h3>
                <small>We’ll keep it to PayPal only.</small>
                <PayPalBuy amount="5.00" description="FaceStyleFun Credit Pack" />
            </section>
        </div>
    );
}
