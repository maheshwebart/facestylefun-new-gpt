import React from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export type User = SupabaseUser;

export interface Profile {
  id: string;
  email: string;
  credits: number;
  is_pro: boolean;
}

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

// Gender
export type Gender = 'male' | 'female';

// Hair Styles
export type HairStyleId = 
  'short-and-neat' | 'modern-fade' | 'long-and-wavy' | 'curly-top' | 'bald-fade' | 'afro' | 'slicked-back' |
  'bob-cut' | 'ponytail' | 'long-straight' | 'pixie-cut' | 'shag-cut' | 'braids' | 'updo';
export type HairStyle = Style<HairStyleId>;

// Beard Styles
export type BeardStyleId = 'full-beard' | 'goatee' | 'stubble' | 'van-dyke' | 'mutton-chops';
export type BeardStyle = Style<BeardStyleId>;

// Sunglasses Styles
export type SunglassesStyleId = 'aviators' | 'wayfarers' | 'round' | 'sporty' | 'clubmasters';
export type SunglassesStyle = Style<SunglassesStyleId>;

// Correction Styles
export type CorrectionStyleId = 'face-brighten' | 'remove-blemishes' | 'whiten-teeth' | 'reduce-wrinkles';
export type CorrectionStyle = Style<CorrectionStyleId>;

// Background Styles
export type BackgroundStyleId = 'professional' | 'beach' | 'city' | 'cafe';
export type BackgroundStyle = Style<BackgroundStyleId>;

// History Item
export interface HistoryItem {
  id: number | string; // Can be number (Date.now()) for local or string (uuid) for DB
  originalImage: ImageData;
  editedImage: string; // This is the watermarked base64 data URL
  prompt: string;
  timestamp: string;
}