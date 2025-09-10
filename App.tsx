import React, { useState } from "react";
import { editImageWithGemini } from "./services/geminiService";
import type { ImageData } from "./types";

/** --- Style catalogs --- */
const HAIR_STYLES = [
  "Short & Neat", "Modern Fade", "Long & Wavy", "Curly Top", "Bald Fade",
  "Afro", "Slicked Back", "Bob Cut", "Ponytail", "Long & Straight",
];

const BEARD_STYLES = [
  "Full Beard", "Goatee", "Light Stubble", "Van Dyke", "Mutton Chops",
];

const GLASSES_STYLES = ["Aviators", "Wayfarers", "Round", "Sporty", "Clubmasters"];

const CORRECTIONS = ["Brighten Face"];

/** --- Helper: convert File -> { base64, mimeType } --- */
function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function App() {
  /** --- App state --- */
  const [credits, setCredits] = useState<number>(3); // starter credits (front-end only)
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [referenceImage, setReferenceImage] = useState<ImageData | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** --- Upload handlers --- */
  async function onUploadOriginal(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      const img = await fileToImageData(e.target.files[0]);
      setOriginalImage(img);
      setEditedImage(null);
      setError(null);
    }
  }
  async function onUploadReference(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      const img = await fileToImageData(e.target.files[0]);
      setReferenceImage(img);
    }
  }

  /** --- Core call: deduct 1 credit on success --- */
  async function runStyle(prompt: string) {
    if (!originalImage) {
      setError("Please upload a profile photo first.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please choose a style or enter a custom prompt.");
      return;
    }
    if (credits <= 0) {
      setError("You don’t have enough credits.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setEditedImage(null);

      const out = await editImageWithGemini(originalImage, prompt.trim(), referenceImage);
      setEditedImage(out);
      setCredits((c) => c - 1); // deduct only after success
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  /** --- Click handlers for tiles --- */
  const clickHair = (name: string) =>
    runStyle(`Apply ${name} hairstyle to this person, keep it realistic and natural.`);
  const clickBeard = (name: string) =>
    runStyle(`Apply ${name} beard style to this person, make it suit the face shape naturally.`);
  const clickGlasses = (name: string) =>
    runStyle(`Add ${name} sunglasses to this person, realistic lighting and reflections.`);
  const clickCorrection = (name: string) => {
    if (name === "Brighten Face") {
      return runStyle("Brighten the face slightly while keeping skin tones natural.");
    }
    return runStyle(name);
  };

  /** --- Custom prompt button --- */
  const applyCustom = () => runStyle(customPrompt);

  return (
    <div className="page">
      {/* Header */}
      <header className="brand">
        <span className="logo">facestyle.fun</span>
        <div className="spacer" />
        <span className="credits">{credits} Credits</span>
        <button
          className="buyBtn"
          onClick={() => alert("Hook this to Stripe/PayPal to add credits")}
        >
          Buy Credits
        </button>
      </header>

      {/* Main content */}
      <main className="container">
        {/* Upload & previews */}
        <section className="panel">
          <h2>Upload</h2>

          <label className="label">Upload Profile Photo</label>
          <input type="file" accept="image/*" onChange={onUploadOriginal} />

          <label className="label mt">Optional: Upload Reference Style Photo</label>
          <input type="file" accept="image/*" onChange={onUploadReference} />

          <div className="previewRow">
            {originalImage && (
              <figure>
                <img
                  src={`data:${originalImage.mimeType};base64,${originalImage.base64}`}
                  alt="Original"
                />
                <figcaption>Original</figcaption>
              </figure>
            )}
            {editedImage && (
              <figure>
                <img
                  src={`data:image/png;base64,${editedImage}`}
                  alt="Edited"
                />
                <figcaption>Edited</figcaption>
              </figure>
            )}
          </div>
        </section>

        {/* Style Editor */}
        <section className="panel">
          <h2>Style Editor</h2>

          <h3>Hairstyle</h3>
          <div className="grid">
            {HAIR_STYLES.map((name) => (
              <button key={name} className="tile" disabled={loading} onClick={() => clickHair(name)}>
                {name}
              </button>
            ))}
          </div>

          <h3 className="mt">Beard</h3>
          <div className="grid">
            {BEARD_STYLES.map((name) => (
              <button key={name} className="tile" disabled={loading} onClick={() => clickBeard(name)}>
                {name}
              </button>
            ))}
          </div>

          <h3 className="mt">Sunglasses</h3>
          <div className="grid">
            {GLASSES_STYLES.map((name) => (
              <button key={name} className="tile" disabled={loading} onClick={() => clickGlasses(name)}>
                {name}
              </button>
            ))}
          </div>

          <h3 className="mt">Corrections</h3>
          <div className="grid">
            {CORRECTIONS.map((name) => (
              <button key={name} className="tile" disabled={loading} onClick={() => clickCorrection(name)}>
                {name}
              </button>
            ))}
          </div>

          <h3 className="mt">Custom Adjustments</h3>
          <p className="hint">
            Describe face or make-up changes. e.g., “add light stubble”, “make them smile subtly”.
          </p>
          <textarea
            className="textInput"
            rows={3}
            placeholder="Type your adjustments here…"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
          <button className="primary mt" disabled={loading} onClick={applyCustom}>
            {loading ? "Applying…" : "Apply Custom"}
          </button>

          {error && <p className="error mt">{error}</p>}
        </section>
      </main>
    </div>
  );
}

/* ---------- Minimal styles (works with your existing public/index.css too) ----------
Add these to public/index.css if you want the exact look.

:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin:0; background:#0b0f14; color:#dff7ff; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif; }
.page { min-height:100vh; }
.brand { display:flex; align-items:center; padding:16px 24px; border-bottom:1px solid #123; position:sticky; top:0; background:#0b0f14cc; backdrop-filter: blur(4px); }
.logo { font-weight:800; font-size:22px; background: linear-gradient(90deg,#7af,#a7f); -webkit-background-clip:text; background-clip:text; color:transparent; }
.spacer { flex:1; }
.credits { margin-right:12px; font-weight:700; color:#ffd56b; }
.buyBtn { background:#0af; color:#001018; padding:8px 12px; border-radius:10px; font-weight:700; border:none; cursor:pointer; }
.buyBtn:hover { filter:brightness(1.08); }
.container { max-width:1100px; margin:24px auto; padding:0 16px; display:grid; gap:20px; grid-template-columns:1fr; }
@media(min-width:980px){ .container { grid-template-columns:1fr 1fr; } }
.panel { background:#0f1620; border:1px solid #123; border-radius:14px; padding:18px; }
h2 { margin:0 0 12px; color:#79e7ff; }
h3 { margin:16px 0 10px; color:#9fe9ff; font-weight:600; }
.label { display:block; margin:10px 0 6px; opacity:.9; }
.mt { margin-top:14px; }
.hint { opacity:.75; margin: 0 0 6px; }
.grid { display:grid; gap:12px; grid-template-columns:repeat(2,minmax(0,1fr)); }
@media(min-width:760px){ .grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
@media(min-width:1100px){ .grid { grid-template-columns:repeat(5,minmax(0,1fr)); } }
.tile { padding:18px 12px; height:86px; background:#121c29; color:#cfefff; border:1px solid #1a2d42; border-radius:12px; cursor:pointer; transition:all .15s; }
.tile:hover { background:#162335; border-color:#244463; transform:translateY(-1px); }
.tile:disabled { opacity:.6; cursor:not-allowed; }
.textInput { width:100%; padding:10px 12px; border-radius:10px; border:1px solid #1a2d42; background:#111a26; color:#dff7ff; }
.primary { padding:10px 14px; border-radius:10px; background:#18a0c6; color:#001018; border:none; font-weight:700; cursor:pointer; }
.primary:hover { filter:brightness(1.05); }
.error { color:#ff7373; }
.previewRow { display:flex; gap:16px; flex-wrap:wrap; margin-top:14px; }
.previewRow figure { margin:0; }
.previewRow img { width:220px; height:auto; border-radius:10px; border:1px solid #1a2d42; background:#0b0f14; }
.previewRow figcaption { text-align:center; opacity:.8; font-size:12px; margin-top:6px; }
------------------------------------------------------------------------------- */
