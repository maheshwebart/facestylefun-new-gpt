import React from 'react';

interface ImageUploadProps {
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error: string | null;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-cyan-500/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);


const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, error }) => {
  return (
    <div className="max-w-3xl mx-auto mt-10">
        <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center w-full h-96 border-2 border-cyan-500/30 border-dashed rounded-2xl cursor-pointer bg-gray-900/50 hover:bg-gray-900 transition-all duration-300 hover:border-cyan-500/70"
        >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadIcon />
                <p className="mb-2 text-xl text-slate-400"><span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop</p>
                <p className="text-sm text-slate-500">PNG, JPG, WEBP (MAX. 10MB)</p>
            </div>
            <input id="image-upload" type="file" className="hidden" onChange={onImageUpload} accept="image/*" />
        </label>
        <p className="mt-4 text-center text-xs text-slate-500">
            For safety reasons, please do not upload images of children or individuals who appear to be under 18.
        </p>
        {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 text-red-300 rounded-lg text-center">
                <p>{error}</p>
            </div>
        )}
    </div>
  );
};

export default ImageUpload;