import React, { useEffect, useMemo, useRef, useState } from "react";
import { editImageWithGemini } from "./services/geminiService";
import type { ImageData } from "./types";
import PromptBar from "./components/PromptBar";
import PayPalBuy from "./components/PayPalBuy";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const UNISEX_HAIR = ["Long & Wavy", "Long & Straight", "Curly Shoulder Length", "Ponytail", "Bob Cut"];
const FEMALE_HAIR = ["Pixie Cut", "Side-Swept Bangs", "Layered Medium", "Messy Bun", "Braided Crown"];
const MALE_HAIR = ["Modern Fade", "Buzz Cut", "Slicked Back", "Curly Top", "Afro"];

const BEARD_STYLES = ["Clean Shaven", "Light Stubble", "Full Beard", "Goatee", "Van Dyke", "Mutton Chops"];
const GLASSES_STYLES = ["Aviators", "Wayfarers", "Round", "Sporty", "Clubmasters"];
const CORRECTIONS = ["Brighten Face"];

export default function App() {
  const [credits, setCredits] = useState<number>(3);
  const [email, setEmail] = useState(localStorage.getItem("fsf_email") || "");
  const [gender, setGender] = useState<"auto" | "female" | "male" | "other">("auto");
  const [consent, setConsent] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

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

  // upload helpers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { localStorage.setItem("fsf_email", email); }, [email]);
  useEffect(() => {
    const v = localStorage.getItem("fsf_consent");
    if (v === "true") setConsent(true); else setShowTerms(true);
  }, []);

  useEffect(() => { refreshCredits(); }, [email]);

  async function refreshCredits() {
    if (!email) return;
    try {
      const r = await fetch("/api/credits", { headers: { "x-user-email": email } });
      if (!r.ok) return;
      const j = await r.json();
      if (typeof j.credits === "number") setCredits(j.credits);
    } catch { }
  }

  async function fileToImageData(file: File): Promise<ImageData> {
    const reader = new FileReader();
    return await new Promise((res, rej) => {
      reader.onloadend = () => res({ base64: String(reader.result).split(",")[1], mimeType: file.type });
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

  function openFilePicker() {
    if (!consent) { setShowTerms(true); return; }
    fileInputRef.current?.click();
  }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragOver(true); }
  function onDragLeave() { setDragOver(false); }
  async function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    if (!consent) { setShowTerms(true); return; }
    const f = e.dataTransfer.files?.[0];
    if (f) {
      const fakeEvt = { target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      await onUploadOriginal(fakeEvt);
    }
  }
  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    if (!consent) { setShowTerms(true); return; }
    await onUploadOriginal(e);
  }

  function downloadEdited() {
    if (!editedImage) return;
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${editedImage}`;
    a.download = `facestyle_${Date.now()}.png`;
    a.click();
  }

  function toggleSingle(current: string | null, value: string, setFn: (v: string | null) => void) {
    setFn(current === value ? null : value);
  }
  function toggleMulti(list: string[], value: string, setFn: (v: string[]) => void) {
    setFn(list.includes(value) ? list.filter(x => x !== value) : [...list, value]);
  }

  const hairList = useMemo(() => {
    if (gender === "female") return [...UNISEX_HAIR, ...FEMALE_HAIR];
    if (gender === "male") return [...UNISEX_HAIR, ...MALE_HAIR];
    return [...UNISEX_HAIR, ...FEMALE_HAIR, ...MALE_HAIR];
  }, [gender]);

  function buildPrompt() {
    const parts: string[] = [];
    if (hair) parts.push(`Apply ${hair} hairstyle`);
    if (gender !== "female" && beard) parts.push(`Apply ${beard} beard`);
    if (glasses) parts.push(`Add ${glasses} sunglasses`);
    corrections.forEach(c => {
      if (c === "Brighten Face") parts.push("Brighten the face slightly while keeping natural skin tones");
      else parts.push(c);
    });
    if (customPrompt.trim()) parts.push(customPrompt.trim());
    if (!parts.length && referenceImage) parts.push("Use the attached reference photo as the styling guide. Preserve identity and realism.");
    return parts.join(". ") || "";
  }

  async function runStyle(prompt: string) {
    if (!consent) { setShowTerms(true); return; }
    if (!originalImage) { setError("Please upload a profile photo first."); return; }
    if (!prompt && !referenceImage) { setError("Choose tiles, type a prompt, or attach a reference."); return; }
    if (credits <= 0) { setError("No credits left."); return; }

    try {
      setLoading(true); setError(null); setEditedImage(null);
      const out = await editImageWithGemini(originalImage, prompt, referenceImage);
      setEditedImage(out);

      if (email) {
        const r = await fetch("/api/credits", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-email": email },
          body: JSON.stringify({ op: "deduct", amount: 1 }),
        });
        if (r.ok) {
          const j = await r.json(); setCredits(j.credits);
        } else { setCredits(c => c - 1); }
      } else {
        setCredits(c => c - 1);
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally { setLoading(false); }
  }

  async function applySelections() {
    const prompt = buildPrompt();
    await runStyle(prompt || "");
  }

  function acceptTerms() { setConsent(true); localStorage.setItem("fsf_consent", "true"); setShowTerms(false); }
  function declineTerms() { setConsent(false); setShowTerms(true); }

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
          <div
            className={`dropzone ${dragOver ? "is-drag" : ""}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="dz-inner">
              <div className="dz-icon">📤</div>
              <div className="dz-text"><strong>Drag & drop</strong> your profile photo here<br />or</div>
              <button className="btn btn-file" type="button" onClick={openFilePicker}>Choose Photo</button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={onFilePicked} hidden />
            </div>
          </div>

          <div className="previewRow">
            {originalImage && (
              <figure>
                <img src={`data:${originalImage.mimeType};base64,${originalImage.base64}`} alt="Original" />
                <figcaption>Original</figcaption>
              </figure>
            )}
            {editedImage && (
              <figure>
                <img src={`data:image/png;base64,${editedImage}`} alt="Edited" />
                <figcaption>
                  Edited
                  <button className="btn btn-download" type="button" onClick={downloadEdited}>⬇ Download</button>
                </figcaption>
              </figure>
            )}
          </div>
        </section>

        {/* Style Editor */}
        <section className="panel">
          <h2>Style Editor</h2>

          <h3>Who are we styling today?</h3>
          <div className="radioRow">
            {["auto", "female", "male", "other"].map((g) => (
              <label key={g} className="radioItem">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={gender === (g as any)}
                  onChange={() => setGender(g as any)}
                />
                {g[0].toUpperCase() + g.slice(1)}
              </label>
            ))}
          </div>

          <h3 className="mt">Hairstyle</h3>
          <div className="grid">
            {hairList.map((n) => (
              <button key={n} className={`tile ${hair === n ? "active" : ""}`} disabled={loading} onClick={() => toggleSingle(hair, n, setHair)}>{n}</button>
            ))}
          </div>

          {gender !== "female" && (
            <>
              <h3 className="mt">Beard</h3>
              <div className="grid">
                {BEARD_STYLES.map((n) => (
                  <button key={n} className={`tile ${beard === n ? "active" : ""}`} disabled={loading} onClick={() => toggleSingle(beard, n, setBeard)}>{n}</button>
                ))}
              </div>
            </>
          )}

          <h3 className="mt">Sunglasses</h3>
          <div className="grid">
            {GLASSES_STYLES.map((n) => (
              <button key={n} className={`tile ${glasses === n ? "active" : ""}`} disabled={loading} onClick={() => toggleSingle(glasses, n, setGlasses)}>{n}</button>
            ))}
          </div>

          <h3 className="mt">Corrections</h3>
          <div className="grid">
            {CORRECTIONS.map((n) => (
              <button key={n} className={`tile ${corrections.includes(n) ? "active" : ""}`} disabled={loading} onClick={() => toggleMulti(corrections, n, setCorrections)}>{n}</button>
            ))}
          </div>

          <h3 className="mt">Custom Adjustments</h3>
          <p className="hint">Attach a reference via ↑ or just type like ChatGPT. Press Enter or click Apply.</p>
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

        <section className="buy-credits" style={{ marginTop: 24 }}>
          <h2>Buy Credits</h2>
          <p>5 credits — $3 &nbsp;&nbsp; 20 credits — $9</p>

          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <div style={{ marginBottom: 8 }}>Buy 5 credits</div>
              <PayPalBuy
                email={email}
                pack="5"
                onSuccess={(newCredits) => setCredits(newCredits)}
                onError={(m) => alert(m)}
              />
            </div>

            <div>
              <div style={{ marginBottom: 8 }}>Buy 20 credits</div>
              <PayPalBuy
                email={email}
                pack="20"
                onSuccess={(newCredits) => setCredits(newCredits)}
                onError={(m) => alert(m)}
              />
            </div>
          </div>
        </section>


      </main>

      {showTerms && (
        <div className="modalBackdrop">
          <div className="modalCard">
            <h3>Terms & Use Confirmation</h3>
            <ul className="termsList">
              <li>You are 18+ and will not upload images of minors.</li>
              <li>You own the image or have explicit permission to use it.</li>
              <li>No illegal, abusive, or non-consensual content.</li>
              <li>Edits are for fun/visualization; AI may be inaccurate.</li>
              <li>We are not liable for misuse or third-party claims.</li>
            </ul>
            <div className="modalActions">
              <button className="btn" onClick={() => setShowTerms(false)}>Cancel</button>
              <button className="btn btn-file" onClick={acceptTerms}>I Agree</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
