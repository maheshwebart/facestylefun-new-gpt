import React, { useState, useRef, useCallback } from 'react';
import ImageDisplay from './ImageDisplay';

interface ImageComparatorProps {
  before: string;
  after: string | null;
  isLoading: boolean;
}

const ImageComparator: React.FC<ImageComparatorProps> = ({ before, after, isLoading }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPos(percent);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const onMouseMove = (moveEvent: MouseEvent) => handleMove(moveEvent.clientX);
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  if (!after && !isLoading) {
    return <ImageDisplay src={before} alt="Original" placeholderText="Your edited image will appear here after applying changes." />;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square overflow-hidden rounded-2xl select-none group"
      style={{ cursor: 'ew-resize' }}
      onMouseDown={handleMouseDown}
      onTouchMove={handleTouchMove}
    >
      <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
      {after && (
        <div
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <img src={after} alt="After" className="absolute inset-0 w-full h-full object-contain" />
        </div>
      )}
      
      {after && (
        <>
            <div
            className="absolute top-0 bottom-0 w-1 bg-cyan-400/80 pointer-events-none transform -translate-x-1/2 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            style={{ left: `${sliderPos}%` }}
            ></div>
            <div
            className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cyan-400/80 ring-4 ring-black/50 pointer-events-none transform -translate-x-1/2 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            style={{ left: `${sliderPos}%` }}
            >
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
            </div>
        </>
      )}

    </div>
  );
};

export default ImageComparator;