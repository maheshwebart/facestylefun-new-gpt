import React, { useState, useEffect } from "react";
import { editImageWithGemini } from "./services/geminiService";
import type { ImageData } from "./types";
import PromptBar from "./components/PromptBar";

const HAIR_STYLES = [
  "Short & Neat", "Modern Fade", "Long & Wavy", "Curly Top", "Bald Fade",
  "Afro", "Slicked Back", "Bob Cut", "Ponytail", "Long & Straight",
];

const BEARD_STYLES = [
  "Full Beard", "Goatee", "Light Stubble", "Van Dyke", "Mutton Chops",
];

const GLASSES_STYLES = ["Aviators", "Wayfarers", "Round", "Sporty", "Clubmasters"];

const CORRECTIONS = ["Brighten Face"];

export default function App() {
  const [credits, setCredits] = useState<number>(3);
  const [email, setEmail] = useState(localStorage.getItem("fsf_email") || "");
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [referenceImage, setReferenceImage] = useState<ImageData | null>(null);

  const [hair, setHair] = useState<string | null>(null);
  const [beard, setBeard] = useState<string | null>(null);
  const [glasses, setGlasses] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");

  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // persist email
  useEffect(() => {
    localStorage.setItem("fsf_email", email);
  }, [email]);

  async function fileToImageData(file: File): Promise<ImageData> {
    const reader = new FileReader();
    return await new Promise((res, rej) => {
      reader.onloadend = () =>
        res({ base64: String(reader.result).split(",")[1], mimeType: file.type });
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  async function onUploadOriginal(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      const img = await fileToImageData(e.target.files[0]);
      setOriginalImage(img);
      setEditedImage(null);
      setError(null);
    }
  }

  // selection helpers
  function toggleSingle(current: string | null, value: string, setFn: (v: string | null) => void) {
    setFn(current === value ? null : value);
  }
  function toggleMulti(list: string[], value: string, setFn: (v: string[]) => void) {
    setFn(list.includes(value) ? list.filter(x => x !== value) : [...list, value]);
  }

  function buildPrompt() {
    const parts: string[] = [];
    if (hair) parts.push(`Apply ${hair} hairstyle`);
    if (beard) parts.push(`Apply ${beard} beard`);
    if (glasses) parts.push(`Add ${glasses} sunglasses`);
    corrections.forEach(c => {
      if (c === "Brighten Face")
        parts.push("Brighten the face slightly while keeping natural skin tones");
      else parts.push(c);
    });
    if (customPrompt.trim()) parts.push(customPrompt.trim());
    if (!parts.length && referenceImage) {
      parts.push("Use the attached reference photo as the styling guide. Preserve identity and realism.");
    }
    return parts.join(". ") || "";
  }

  async function runStyle(prompt: string) {
    if (!originalImage) {
      setError("Please upload a profile photo first.");
      return;
    }
    if (!prompt && !referenceImage) {
      setError("Choose tiles, type a prompt, or attach a reference.");
      return;
    }
    if (credits <= 0) {
      setError("No credits left.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setEditedImage(null);

      const out = await editImageWithGemini(originalImage, prompt, referenceImage);
      setEditedImage(out);

      // deduct credit (server-backed if email provided)
      if (email) {
        const r = await fetch("/.netlify/functions/credits", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-email": email },
          body: JSON.stringify({ op: "deduct", amount: 1 }),
        });
        const j = await r.json();
        setCredits(j.credits);
      } else {
        setCredits(c => c - 1);
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function applySelections() {
    const prompt = buildPrompt();
    await runStyle(prompt || "");
  }

  return (
    <div className="page">
      <header className="brand">
        <span className="logo">facestyle.fun</span>
        <div className="spacer" />
        <input
          className="textInput"
          style={{ width: 220, marginRight: 8 }}
          placeholder="Email to save credits"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <span className="credits">{credits} Credits</span>
      </header>

      <main className="container">
        {/* Upload */}
        <section className="panel">
          <h2>Upload</h2>
          <label className="label">Upload Profile Photo</label>
          <input type="file" accept="image/*" onChange={onUploadOriginal} />

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
            {HAIR_STYLES.map((n) => (
              <button
                key={n}
                className={`tile ${hair === n ? "active" : ""}`}
                disabled={loading}
                onClick={() => toggleSingle(hair, n, setHair)}
              >{n}</button>
            ))}
          </div>

          <h3 className="mt">Beard</h3>
          <div className="grid">
            {BEARD_STYLES.map((n) => (
              <button
                key={n}
                className={`tile ${beard === n ? "active" : ""}`}
                disabled={loading}
                onClick={() => toggleSingle(beard, n, setBeard)}
              >{n}</button>
            ))}
          </div>

          <h3 className="mt">Sunglasses</h3>
          <div className="grid">
            {GLASSES_STYLES.map((n) => (
              <button
                key={n}
                className={`tile ${glasses === n ? "active" : ""}`}
                disabled={loading}
                onClick={() => toggleSingle(glasses, n, setGlasses)}
              >{n}</button>
            ))}
          </div>

          <h3 className="mt">Corrections</h3>
          <div className="grid">
            {CORRECTIONS.map((n) => (
              <button
                key={n}
                className={`tile ${corrections.includes(n) ? "active" : ""}`}
                disabled={loading}
                onClick={() => toggleMulti(corrections, n, setCorrections)}
              >{n}</button>
            ))}
          </div>

          <h3 className="mt">Custom Adjustments</h3>
          <PromptBar
            value={customPrompt}
            onChange={setCustomPrompt}
            reference={referenceImage}
            onAttach={setReferenceImage}
            onSubmit={applySelections}
            disabled={loading}
          />

          <button className="primary mt" disabled={loading} onClick={applySelections}>
            {loading ? "Applying…" : "Apply Selected"}
          </button>

          {error && <p className="error mt">{error}</p>}
        </section>
      </main>
    </div>
  );
}
