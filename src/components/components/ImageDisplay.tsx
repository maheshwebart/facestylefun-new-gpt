import React from 'react';

interface ImageDisplayProps {
  src: string | null;
  alt: string;
  placeholderText?: string;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ src, alt, placeholderText }) => {
  return (
    <div className="aspect-w-1 aspect-h-1 w-full bg-gray-900/50 rounded-xl overflow-hidden shadow-lg border border-gray-700">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-contain" />
      ) : (
        <div className="flex items-center justify-center h-full text-slate-500 p-8 text-center">
          {placeholderText}
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;