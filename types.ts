import React from 'react';

export interface ImageData {
  base64: string;
  mimeType: string;
  name: string;
}

// Generic Style Interface
export interface Style<T extends string> {
  id: T;
  name: string;
  prompt: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

// Hair Styles
export type HairStyleId = 
  'short-and-neat' | 'modern-fade' | 'long-and-wavy' | 'curly-top' | 'bald-fade' | 'afro' | 'slicked-back' |
  'bob-cut' | 'ponytail' | 'long-straight';
export type HairStyle = Style<HairStyleId>;

// Beard Styles
export type BeardStyleId = 'full-beard' | 'goatee' | 'stubble' | 'van-dyke' | 'mutton-chops';
export type BeardStyle = Style<BeardStyleId>;

// Sunglasses Styles
export type SunglassesStyleId = 'aviators' | 'wayfarers' | 'round' | 'sporty' | 'clubmasters';
export type SunglassesStyle = Style<SunglassesStyleId>;

// Correction Styles
export type CorrectionStyleId = 'face-brighten';
export type CorrectionStyle = Style<CorrectionStyleId>;

// History Item
export interface HistoryItem {
  id: number;
  originalImage: ImageData;
  editedImage: string; // This is the watermarked base64 data URL
  prompt: string;
  timestamp: string;
}
