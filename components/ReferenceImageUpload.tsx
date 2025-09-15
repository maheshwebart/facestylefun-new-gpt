import React from 'react';
import type { ImageData } from '../types';

interface ReferenceImageUploadProps {
  referenceImage: ImageData | null;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  disabled: boolean;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const RemoveIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ReferenceImageUpload: React.FC<ReferenceImageUploadProps> = ({ referenceImage, onImageUpload, onRemoveImage, disabled }) => {
  return (
    <div className="w-full text-left">
        <h3 className="text-md font-semibold text-cyan-400 mb-2">Hairstyle by Reference</h3>
        <p className="text-xs text-slate-500 mb-3">(Optional) Upload an image to copy its hairstyle.</p>

        {referenceImage ? (
            <div className="relative inline-block group">
                <img
                    src={`data:${referenceImage.mimeType};base64,${referenceImage.base64}`}
                    alt="Reference"
                    className="h-20 w-20 object-cover rounded-lg border-2 border-cyan-500 shadow-lg"
                />
                <button
                    onClick={onRemoveImage}
                    disabled={disabled}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    aria-label="Remove reference image"
                >
                    <RemoveIcon />
                </button>
            </div>
        ) : (
            <label
                htmlFor="reference-image-upload"
                className={`flex items-center justify-center w-full px-4 py-3 border-2 border-gray-700 border-dashed rounded-xl cursor-pointer bg-gray-800/60 transition-colors duration-300 ${disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-gray-800 hover:border-gray-600'}`}
            >
                <UploadIcon />
                <span className="text-slate-400 text-sm font-semibold">Upload Style Reference</span>
                <input id="reference-image-upload" type="file" className="hidden" onChange={onImageUpload} accept="image/*" disabled={disabled} />
            </label>
        )}
    </div>
  );
};

export default ReferenceImageUpload;