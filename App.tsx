import React, { useState } from "react";
import { editImageWithGemini } from "./services/geminiService";
import type { ImageData } from "./types";

export default function App() {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [referenceImage, setReferenceImage] = useState<ImageData | null>(null);
  const [prompt, setPrompt] = useState("");
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper: read file as base64
  const fileToImageData = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve({ base64, mimeType: file.type });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleOriginalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const img = await fileToImageData(e.target.files[0]);
      setOriginalImage(img);
    }
  };

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const img = await fileToImageData(e.target.files[0]);
      setReferenceImage(img);
    }
  };

  const handleSubmit = async () => {
    if (!originalImage || !prompt) {
      setError("Please upload an image and enter a prompt.");
      return;
    }

    try {
      setError(null);
      setLoading(true);
      setEditedImage(null);

      const result = await editImageWithGemini(originalImage, prompt, referenceImage);
      setEditedImage(result);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4">FaceStyle Fun 🎨</h1>

      <div className="mb-4">
        <label className="block mb-2">Upload Profile Photo</label>
        <input type="file" accept="image/*" onChange={handleOriginalUpload} />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Optional: Upload Reference Style Photo</label>
        <input type="file" accept="image/*" onChange={handleReferenceUpload} />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Enter Style Prompt</label>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-2 rounded text-black"
          placeholder="e.g., Apply short beard style"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 bg-cyan-600 rounded hover:bg-cyan-700 disabled:opacity-50"
      >
        {loading ? "Applying style..." : "Apply Style"}
      </button>

      {error && <p className="mt-4 text-red-400">{error}</p>}

      {editedImage && (
        <div className="mt-6">
          <h2 className="text-xl mb-2">Edited Photo:</h2>
          <img
            src={`data:image/png;base64,${editedImage}`}
            alt="Edited result"
            className="rounded shadow-lg max-w-sm"
          />
        </div>
      )}
    </div>
  );
}
