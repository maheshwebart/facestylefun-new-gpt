
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { editImageWithGemini } from './services/geminiService';
import type { ImageData, HairStyle, BeardStyle, SunglassesStyle, CorrectionStyle, BackgroundStyle, HairStyleId, BeardStyleId, SunglassesStyleId, CorrectionStyleId, BackgroundStyleId, HistoryItem, Gender } from './types';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import ReferenceImageUpload from './components/ReferenceImageUpload';
import Button from './components/Button';
import HairStyleSelector from './components/HairStyleSelector';
import ImageComparator from './components/ImageComparator';
import Footer from './components/Footer';
import Modal from './components/Modal';
import CustomPromptInput from './components/CustomPromptInput';
import PayPalButton from './components/PayPalButton';
import RazorpayButton from './components/RazorpayButton';
import ShareButtons from './components/ShareButtons';
import HistoryPanel from './components/HistoryPanel';
import AuthModal from './components/AuthModal';
import TermsModal from './components/TermsModal';
import GenderSelector from './components/GenderSelector';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './services/supabaseClient';
import CouponRedeemer from './components/CouponRedeemer';
import { PAYPAL_CLIENT_ID, RAZORPAY_KEY_ID } from './config';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import Spinner from './components/Spinner';

import { 
  ShortAndNeatIcon, ModernFadeIcon, LongAndWavyIcon, CurlyTopIcon, BaldFadeIcon, AfroIcon, SlickedBackIcon,
  BobCutIcon, PonytailIcon, LongStraightIcon, PixieCutIcon, ShagCutIcon, BraidsIcon, UpdoIcon,
  FullBeardIcon, GoateeIcon, StubbleIcon, VanDykeIcon, MuttonChopsIcon,
  AviatorsIcon, WayfarersIcon, RoundIcon, SportyIcon, ClubmastersIcon,
  BrightenFaceIcon, BlemishesIcon, TeethIcon, WrinklesIcon,
  ProfessionalIcon, BeachIcon, CityIcon, CafeIcon
} from './components/HairStyleIcons';

const MALE_HAIR_STYLES: HairStyle[] = [
  { id: 'short-and-neat', name: 'Short & Neat', prompt: 'a classic short and neat men\'s hairstyle', icon: ShortAndNeatIcon },
  { id: 'modern-fade', name: 'Modern Fade', prompt: 'a stylish modern fade men\'s hairstyle', icon: ModernFadeIcon },
  { id: 'long-and-wavy', name: 'Long & Wavy', prompt: 'a longer, wavy hairstyle for men', icon: LongAndWavyIcon },
  { id: 'curly-top', name: 'Curly Top', prompt: 'a men\'s curly top hairstyle', icon: CurlyTopIcon },
  { id: 'bald-fade', name: 'Bald Fade', prompt: 'a clean bald fade for men', icon: BaldFadeIcon },
  { id: 'afro', name: 'Afro', prompt: 'a natural men\'s afro hairstyle', icon: AfroIcon },
  { id: 'slicked-back', name: 'Slicked Back', prompt: 'a classic men\'s slicked back look', icon: SlickedBackIcon },
];
const FEMALE_HAIR_STYLES: HairStyle[] = [
  { id: 'bob-cut', name: 'Bob Cut', prompt: `a classic women's bob cut hairstyle`, icon: BobCutIcon },
  { id: 'ponytail', name: 'Ponytail', prompt: `a sleek women's ponytail hairstyle`, icon: PonytailIcon },
  { id: 'long-straight', name: 'Long & Straight', prompt: `a long, straight women's hairstyle`, icon: LongStraightIcon },
  { id: 'pixie-cut', name: 'Pixie Cut', prompt: `a chic women's pixie cut hairstyle`, icon: PixieCutIcon },
  { id: 'shag-cut', name: 'Shag Cut', prompt: `a trendy, layered women's shag cut hairstyle`, icon: ShagCutIcon },
  { id: 'braids', name: 'Braids', prompt: `an elegant braided hairstyle for women`, icon: BraidsIcon },
  { id: 'updo', name: 'Formal Updo', prompt: `a formal updo hairstyle for women`, icon: UpdoIcon },
];
const BEARD_STYLES: BeardStyle[] = [
    { id: 'full-beard', name: 'Full Beard', prompt: 'a neat full beard', icon: FullBeardIcon },
    { id: 'goatee', name: 'Goatee', prompt: 'a stylish goatee', icon: GoateeIcon },
    { id: 'stubble', name: 'Light Stubble', prompt: `a light stubble or 5 o'clock shadow`, icon: StubbleIcon },
    { id: 'van-dyke', name: 'Van Dyke', prompt: 'a classic Van Dyke beard', icon: VanDykeIcon },
    { id: 'mutton-chops', name: 'Mutton Chops', prompt: 'prominent mutton chop sideburns', icon: MuttonChopsIcon },
];
const SUNGLASSES_STYLES: SunglassesStyle[] = [
    { id: 'aviators', name: 'Aviators', prompt: 'a pair of classic aviator sunglasses', icon: AviatorsIcon },
    { id: 'wayfarers', name: 'Wayfarers', prompt: 'a pair of black wayfarer sunglasses', icon: WayfarersIcon },
    { id: 'round', name: 'Round', prompt: 'a pair of round, retro-style sunglasses', icon: RoundIcon },
    { id: 'sporty', name: 'Sporty', prompt: 'a pair of sporty, wraparound sunglasses', icon: SportyIcon },
    { id: 'clubmasters', name: 'Clubmasters', prompt: 'a pair of stylish clubmaster sunglasses', icon: ClubmastersIcon },
];
const BACKGROUND_STYLES: BackgroundStyle[] = [
    { id: 'professional', name: 'Professional', prompt: 'change the background to a professional, out-of-focus office or studio setting', icon: ProfessionalIcon },
    { id: 'beach', name: 'Beach', prompt: 'change the background to a sunny tropical beach with palm trees and clear water', icon: BeachIcon },
    { id: 'city', name: 'City Night', prompt: 'change the background to a vibrant, blurry city street at night with neon lights', icon: CityIcon },
    { id: 'cafe', name: 'Cozy Cafe', prompt: 'change the background to the interior of a warm, cozy cafe', icon: CafeIcon },
];
const CORRECTION_STYLES: CorrectionStyle[] = [
    { id: 'face-brighten', name: 'Brighten Face', prompt: 'subtly brighten the lighting on the person\'s face', icon: BrightenFaceIcon },
    { id: 'remove-blemishes', name: 'Remove Blemishes', prompt: 'gently remove any visible skin blemishes like pimples or spots, keeping the skin texture natural', icon: BlemishesIcon },
    { id: 'whiten-teeth', name: 'Whiten Teeth', prompt: 'subtly whiten the person\'s teeth if they are smiling and teeth are visible, making it look natural', icon: TeethIcon },
    { id: 'reduce-wrinkles', name: 'Reduce Wrinkles', prompt: 'soften the appearance of wrinkles around the eyes and mouth for a slightly younger, refreshed look without looking artificial', icon: WrinklesIcon },
];

const PRIVACY_POLICY = "Your privacy is important to us. When you upload an image, it is sent to Google's Gemini API for processing. We do not store your images on our servers after the editing process is complete. The generated image is available for you to download directly and is not retained by us. By using this service, you agree to Google's API terms of service and privacy policy.";
const TERMS_OF_SERVICE = "This service is provided for entertainment purposes. You are responsible for the images you upload and must have the necessary rights to use them. Do not upload content that is illegal, or infringes on the rights of others. We are not liable for any misuse of this service or for the content generated. The service is provided 'as is' without warranties of any kind. We reserve the right to change or discontinue the service at any time.";

const CREDIT_TIERS = [
  { credits: 10, price: '1.99', description: 'Starter Pack: 10 Credits', tag: null },
  { credits: 60, price: '8.99', description: 'Value Pack: 60 Credits', tag: 'Most Popular' },
  { credits: 200, price: '24.99', description: 'Pro Pack: 200 Credits', tag: 'Best Value' },
];

const PRO_TIER = {
  price: '9.99',
  description: 'facestyle.fun Pro Subscription',
};

const App: React.FC = () => {
  const { user, profile, refreshProfile, updateLocalProfile } = useAuth();
  
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [referenceImage, setReferenceImage] = useState<ImageData | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<{title: string, content: string} | null>(null);
  
  const [selectedHairId, setSelectedHairId] = useState<HairStyleId | null>(null);
  const [selectedBeardId, setSelectedBeardId] = useState<BeardStyleId | null>(null);
  const [selectedSunglassesId, setSelectedSunglassesId] = useState<SunglassesStyleId | null>(null);
  const [selectedCorrectionId, setSelectedCorrectionId] = useState<CorrectionStyleId | null>(null);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<BackgroundStyleId | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  const [gender, setGender] = useState<Gender>('female');
  
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>(() => {
    try {
      const savedHistory = localStorage.getItem('userHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (e) { return []; }
  });
  const [cloudHistory, setCloudHistory] = useState<HistoryItem[]>([]);

  // Centralized state for guest credits
  const [guestCredits, setGuestCredits] = useState<number>(() => {
    return parseInt(localStorage.getItem('guestCredits') || '3', 10);
  });

  const isProUser = profile?.is_pro ?? false;
  
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [purchaseModalTab, setPurchaseModalTab] = useState<'credits' | 'pro'>('credits');
  const [purchaseReason, setPurchaseReason] = useState<string | null>(null);

  const [selectedTier, setSelectedTier] = useState<typeof CREDIT_TIERS[number] | null>(CREDIT_TIERS[1]);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to persist guest credits to localStorage
  useEffect(() => {
    if (!user) { // Only manage localStorage for guests
      localStorage.setItem('guestCredits', guestCredits.toString());
    }
  }, [guestCredits, user]);

  useEffect(() => {
    if (!user) { // Only use local storage for history for guests
      try {
        localStorage.setItem('userHistory', JSON.stringify(localHistory));
      } catch (e) {
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
          console.warn("LocalStorage quota exceeded. Removing oldest history item to make space.");
          // Self-healing: remove the oldest item to make space
          const trimmedHistory = localHistory.slice(0, localHistory.length - 1);
          setLocalHistory(trimmedHistory);
          // Retry saving immediately
          try {
            localStorage.setItem('userHistory', JSON.stringify(trimmedHistory));
          } catch (retryError) {
            console.error("Failed to save history to localStorage even after trimming:", retryError);
          }
        } else {
          console.error("Failed to save history to localStorage:", e);
        }
      }
    } else { // Clear local storage on login
      if (localStorage.getItem('userHistory')) localStorage.removeItem('userHistory');
      if (localStorage.getItem('guestCredits')) localStorage.removeItem('guestCredits');
      if (localHistory.length > 0) setLocalHistory([]);
    }
  }, [localHistory, user]);

  useEffect(() => {
    const fetchCloudHistory = async () => {
        if (!user || !supabase) return;
        try {
            const { data, error } = await supabase
                .from('creations')
                .select('id, created_at, original_image_base64, original_image_mimetype, original_image_name, edited_image_base64_url, prompt')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                const mappedHistory: HistoryItem[] = data.map(item => ({ id: item.id, originalImage: { base64: item.original_image_base64, mimeType: item.original_image_mimetype, name: item.original_image_name }, editedImage: item.edited_image_base64_url, prompt: item.prompt, timestamp: new Date(item.created_at).toLocaleString() }));
                setCloudHistory(mappedHistory);
            }
        } catch (err) {
            console.error('Error fetching cloud history:', err);
            setError('Could not load your cloud history.');
        }
    };
    if (isProUser) fetchCloudHistory(); else setCloudHistory([]);
  }, [user, isProUser]);
  
  const addWatermark = (base64WithHeader: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d'); if (!ctx) return reject(new Error('Could not get canvas context'));
            ctx.drawImage(img, 0, 0);
            const fontSize = Math.max(16, Math.round(img.width / 55));
            ctx.font = `bold ${fontSize}px 'Poppins', sans-serif`; ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
            const padding = Math.round(img.width / 80); ctx.fillText('facestyle.fun', canvas.width - padding, canvas.height - padding);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(new Error('Failed to load image for watermarking'));
        img.src = base64WithHeader;
    });
  };
  
  const processImageFile = async (file: File, type: 'original' | 'reference') => {
      if (!file.type.startsWith('image/')) { setError('Please upload a valid image file (PNG, JPG, etc.).'); return; }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const mimeType = file.type;
        const imageData = { base64: base64String.split(',')[1], mimeType: mimeType, name: file.name };
        
        if (type === 'original') {
            setOriginalImage(imageData);
            handleResetSelections();
            setGender('female');
        } else {
            setReferenceImage(imageData);
            setSelectedHairId(null);
        }
      };
      reader.onerror = () => setError(`Failed to read the ${type} image file.`);
      reader.readAsDataURL(file);
  }
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) processImageFile(event.target.files[0], 'original');
  };

  const handleUploadClick = () => {
    const hasAgreed = sessionStorage.getItem('termsAgreed') === 'true';
    if (hasAgreed) fileInputRef.current?.click(); else setShowTermsModal(true);
  };

  const handleTermsAgree = () => { sessionStorage.setItem('termsAgreed', 'true'); setShowTermsModal(false); fileInputRef.current?.click(); };
  
  const executeImageEdit = async (cost: number, fullPrompt: string) => {
    if (!originalImage) return;
    
    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const resultBase64 = await editImageWithGemini(originalImage, fullPrompt, referenceImage);
      const watermarkedImage = await addWatermark(`data:image/png;base64,${resultBase64}`);
      
      setEditedImage(watermarkedImage);
      setIsLoading(false);

      try {
        if (!isProUser) {
          if (user && supabase) {
            const { data: newCredits, error: rpcError } = await supabase.rpc('add_credits', { credits_to_add: -cost });

            if (rpcError) {
              console.error("RPC error deducting credits:", rpcError);
              throw new Error("Failed to deduct credits from your account.");
            }
            if (typeof newCredits === 'number') {
              updateLocalProfile({ credits: newCredits });
            } else {
              console.warn("RPC 'add_credits' did not return new balance. Using fallback refresh.");
              await refreshProfile();
            }
          } else {
            setGuestCredits(prevCredits => prevCredits - cost);
          }
        }
        
        if (isProUser && user && supabase) {
          const { data, error } = await supabase.from('creations').insert({ user_id: user.id, original_image_base64: originalImage.base64, original_image_mimetype: originalImage.mimeType, original_image_name: originalImage.name, edited_image_base64_url: watermarkedImage, prompt: fullPrompt }).select().single();
          if (error) throw error;
          if (data) {
              const newHistoryItem: HistoryItem = { id: data.id, originalImage: { base64: data.original_image_base64, mimeType: data.original_image_mimetype, name: data.original_image_name }, editedImage: data.edited_image_base64_url, prompt: data.prompt, timestamp: new Date(data.created_at).toLocaleString() };
              setCloudHistory(prev => [newHistoryItem, ...prev]);
          }
        } else {
          const newHistoryItem: HistoryItem = { id: Date.now(), originalImage: originalImage, editedImage: watermarkedImage, prompt: fullPrompt, timestamp: new Date().toLocaleString() };
          setLocalHistory(prev => [newHistoryItem, ...prev]);
        }
      } catch (backgroundError) {
        console.error("Error during background task (credits/history):", backgroundError);
        setError("Image generated, but failed to update credits or history. Please refresh to see accurate counts.");
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during image generation.');
      setIsLoading(false);
    }
  };
  
  const featureCount = useMemo(() => {
    const count = [selectedHairId, selectedBeardId, selectedSunglassesId, referenceImage, selectedCorrectionId, customPrompt.trim(), selectedBackgroundId].filter(Boolean).length;
    return Math.max(1, count);
  }, [selectedHairId, selectedBeardId, selectedSunglassesId, referenceImage, selectedCorrectionId, customPrompt, selectedBackgroundId]);

  const effectiveGender = gender;
  
  const hasSelection = Boolean(selectedHairId || selectedBeardId || selectedSunglassesId || referenceImage || selectedCorrectionId || selectedBackgroundId || customPrompt.trim());

  const handleApplyChanges = async () => {
    if (isLoading || !hasSelection) {
      if (!hasSelection) setError("Please select at least one style to apply.");
      return;
    }

    const cost = isProUser ? 0 : featureCount;
    const currentCredits = profile?.credits ?? guestCredits;

    if (currentCredits < cost) {
      let reason = `You need ${cost} credit${cost > 1 ? 's' : ''} for this edit, but you only have ${currentCredits}. Please top up.`;
      if (!user) reason = `Your free guest credits are not enough for this ${cost}-credit edit. Please sign in or buy a credit pack.`
      setPurchaseReason(reason);
      setError(null);
      setPurchaseModalTab('credits');
      setShowPurchaseModal(true);
      return;
    }

    const promptParts: string[] = [];
    const hairStyles = effectiveGender === 'male' ? MALE_HAIR_STYLES : FEMALE_HAIR_STYLES;
    
    if (referenceImage) {
        promptParts.push(`Apply the hairstyle from the reference image. Correct any visible hair loss.`);
    } else if (selectedHairId) {
        const style = hairStyles.find(s => s.id === selectedHairId);
        if (style) promptParts.push(`Apply hairstyle: ${style.prompt}. Correct any visible hair loss.`);
    }
    
    if (selectedBeardId && effectiveGender === 'male') {
        const style = BEARD_STYLES.find(s => s.id === selectedBeardId);
        if (style) promptParts.push(`Add beard: ${style.prompt}.`);
    }

    if (selectedSunglassesId) {
        const style = SUNGLASSES_STYLES.find(s => s.id === selectedSunglassesId);
        if (style) promptParts.push(`Add sunglasses: ${style.prompt}.`);
    }
    
    if (selectedBackgroundId) {
        const style = BACKGROUND_STYLES.find(s => s.id === selectedBackgroundId);
        if (style) promptParts.push(`Background: ${style.prompt}.`);
    }

    if (selectedCorrectionId) {
        const style = CORRECTION_STYLES.find(s => s.id === selectedCorrectionId);
        if (style) promptParts.push(`Correction: ${style.prompt}.`);
    }

    if (customPrompt.trim()) {
        promptParts.push(`Custom adjustment: "${customPrompt.trim()}".`);
    }
    
    const fullPrompt = `For the person in the main image, apply these changes: ${promptParts.join(' ')} The final result must be photorealistic and blend seamlessly.`;
    
    await executeImageEdit(cost, fullPrompt);
  };
  
  const handlePayPalError = useCallback((err: string) => {
      setError(`PayPal Error: ${err}`);
      setPaymentStatus('idle');
  }, []);
  
  const handleRazorpayError = useCallback((err: string) => {
      setError(`Razorpay Error: ${err}`);
      setPaymentStatus('idle');
  }, []);

  const handlePaymentSuccess = useCallback(async (details?: any) => {
    setPaymentStatus('processing');
    setError(null);

    try {
        if (!selectedTier) throw new Error('No credit tier selected. Please try again.');
        if (!supabase) throw new Error("Could not connect to the database. Please try again later.");
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            setShowPurchaseModal(false); setPaymentStatus('idle'); setShowAuthModal(true);
            setError("Authentication error. Please sign in to add credits to your account.");
            return;
        }
        
        const creditsToAdd = selectedTier.credits;
        const operationPromise = supabase.rpc('add_credits', { credits_to_add: creditsToAdd });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Server response timed out. Please contact support if your credits don't appear shortly.")), 20000));
        const { error: rpcError } = await Promise.race<any>([operationPromise, timeoutPromise]);
        
        if (rpcError) {
            console.error('RPC Error adding credits:', rpcError);
            throw new Error(`Server error: Could not apply credits. Please contact support.`);
        }
        
        await refreshProfile();
        setPaymentStatus('success');
    } catch (err) {
        setError(err instanceof Error ? `Payment processing failed: ${err.message}` : 'An unknown error occurred while updating your profile. Please contact support.');
        setPaymentStatus('idle');
    }
  }, [refreshProfile, selectedTier]);
  
  const handleProSubscriptionSuccess = useCallback(async (details?: any) => {
    setPaymentStatus('processing');
    setError(null);
    
    try {
        if (!supabase) throw new Error("Could not connect to the database. Please try again later.");

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            setShowPurchaseModal(false); setPaymentStatus('idle'); setShowAuthModal(true);
            setError("Please sign in to activate your Pro subscription."); return;
        }
        
        const operationPromise = supabase.rpc('activate_pro_subscription');
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Server response timed out. Please contact support if your subscription isn't active shortly.")), 20000));
        const { error: rpcError } = await Promise.race<any>([operationPromise, timeoutPromise]);
        
        if (rpcError) {
            console.error('RPC Error activating pro:', rpcError);
            throw new Error(`Server error: Could not activate Pro plan. Please contact support.`);
        }

        await refreshProfile();
        setPaymentStatus('success');
    } catch (err) {
        setError(err instanceof Error ? `Failed to activate Pro plan: ${err.message}` : 'An unknown error occurred while activating your Pro plan.');
        setPaymentStatus('idle');
    }
  }, [refreshProfile]);

  const closePurchaseModalAndReset = useCallback(() => {
    if (paymentStatus === 'processing') return; // Don't allow closing while processing
    setShowPurchaseModal(false);
    setPaymentStatus('idle');
    setSelectedTier(CREDIT_TIERS[1]);
    setError(null);
    setPurchaseReason(null);
  }, [paymentStatus]);

  const handleOpenPurchaseModal = (tab: 'credits' | 'pro' = 'credits') => {
    setPurchaseReason(null); setPurchaseModalTab(tab); setShowPurchaseModal(true); setPaymentStatus('idle'); setSelectedTier(CREDIT_TIERS[1]); setError(null);
  }
  
  const handleResetSelections = useCallback(() => {
      setEditedImage(null); setError(null); setReferenceImage(null); setSelectedHairId(null); setSelectedBeardId(null);
      setSelectedSunglassesId(null); setSelectedCorrectionId(null); setCustomPrompt(''); setSelectedBackgroundId(null);
  }, []);

  const handleStartOver = () => { setOriginalImage(null); setIsLoading(false); handleResetSelections(); };
  
  const handleDownload = () => {
    if (!editedImage) return; const link = document.createElement('a'); link.href = editedImage;
    link.download = `facestyle.fun-${Date.now()}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };
  
  const onHairStyleSelect = (style: HairStyle | null) => {
    if (style) { setReferenceImage(null); setSelectedHairId(style.id as HairStyleId); } else setSelectedHairId(null);
  };
  
  const handleLoadHistoryItem = (item: HistoryItem) => { handleResetSelections(); setOriginalImage(item.originalImage); setEditedImage(item.editedImage); };
  
  const handleClearHistory = () => { setLocalHistory([]); };

  const handleGenderChange = (newGender: Gender) => {
    setGender(newGender);
    setSelectedHairId(null); // Reset hair selection when gender changes
    setSelectedBeardId(null); // Reset beard selection
  };
  
  const currentCredits = profile?.credits ?? guestCredits;
  const showPrivacyPolicy = () => setModalContent({ title: 'Privacy Policy', content: PRIVACY_POLICY });
  const showTerms = () => setModalContent({ title: 'Terms of Service', content: TERMS_OF_SERVICE });
  const getButtonText = () => {
    if (isLoading) return 'Applying...'; if (isProUser) return 'Apply Changes (Pro)';
    const cost = featureCount;
    return `Apply Changes (${cost} Credit${cost > 1 ? 's' : ''})`;
  }
  const historyToShow = isProUser ? cloudHistory : localHistory;
  const hairStylesToShow = effectiveGender === 'male' ? MALE_HAIR_STYLES : FEMALE_HAIR_STYLES;

  const paypalOptions = {
      clientId: PAYPAL_CLIENT_ID || 'sb',
      currency: "USD",
      intent: "capture",
  };
  
  const arePaymentsConfigured = PAYPAL_CLIENT_ID || RAZORPAY_KEY_ID;

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans flex flex-col">
      <Header onAuthClick={() => setShowAuthModal(true)} onBuyCreditsClick={() => handleOpenPurchaseModal('credits')} credits={currentCredits} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
        {!originalImage ? (
          <ImageUpload onUploadClick={handleUploadClick} error={error} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-2xl border border-cyan-500/20 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-cyan-400">Style Editor</h2>
                    {!isProUser && (
                      <button onClick={() => handleOpenPurchaseModal('pro')} className="text-xs font-semibold bg-yellow-400/10 text-yellow-300 px-2 py-1 rounded-md border border-yellow-400/20 hover:bg-yellow-400/20 transition-colors">Go PRO</button>
                    )}
                </div>
                <GenderSelector selectedGender={gender} onGenderChange={handleGenderChange} disabled={isLoading} />
                <HairStyleSelector title="Hairstyle" styles={hairStylesToShow} selectedStyleId={selectedHairId} onStyleSelect={(style) => onHairStyleSelect(style as HairStyle | null)} disabled={isLoading || !!referenceImage || !effectiveGender} />
                <ReferenceImageUpload referenceImage={referenceImage} onImageUpload={(e) => e.target.files && processImageFile(e.target.files[0], 'reference')} onRemoveImage={() => setReferenceImage(null)} disabled={isLoading || !effectiveGender} />
                {effectiveGender === 'male' && <HairStyleSelector title="Beard" styles={BEARD_STYLES} selectedStyleId={selectedBeardId} onStyleSelect={(style) => setSelectedBeardId(style ? style.id as BeardStyleId : null)} disabled={isLoading} />}
                <HairStyleSelector title="Sunglasses" styles={SUNGLASSES_STYLES} selectedStyleId={selectedSunglassesId} onStyleSelect={(style) => setSelectedSunglassesId(style ? style.id as SunglassesStyleId : null)} disabled={isLoading} />
                <HairStyleSelector title="Background" styles={BACKGROUND_STYLES} selectedStyleId={selectedBackgroundId} onStyleSelect={(style) => setSelectedBackgroundId(style ? style.id as BackgroundStyleId : null)} disabled={isLoading} />
                <HairStyleSelector title="Corrections" styles={CORRECTION_STYLES} selectedStyleId={selectedCorrectionId} onStyleSelect={(style) => setSelectedCorrectionId(style ? style.id as CorrectionStyleId : null)} disabled={isLoading} />
                <CustomPromptInput value={customPrompt} onChange={setCustomPrompt} disabled={isLoading} />
            </div>

            <div className="lg:col-span-2 flex flex-col items-center justify-center gap-6">
                <div className="w-full max-w-3xl relative">
                    <ImageComparator before={originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : ''} after={editedImage} isLoading={isLoading} />
                </div>
                {error && (<div className="w-full max-w-3xl p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg text-center"><p className="font-bold">Heads up!</p><p>{error}</p></div>)}
                <div className="flex justify-center items-center gap-4 flex-wrap">
                   <Button onClick={handleApplyChanges} variant="primary" disabled={isLoading || !hasSelection}> {getButtonText()} </Button>
                  {editedImage && !isLoading && (<><Button onClick={handleDownload} variant="primary" disabled={isLoading}> Download Image </Button><ShareButtons imageSrc={editedImage} /></>)}
                   <Button onClick={handleStartOver} variant="secondary" disabled={isLoading}> Start Over </Button>
                </div>
                <HistoryPanel history={historyToShow} isProUser={isProUser} onLoadItem={handleLoadHistoryItem} onClearHistory={handleClearHistory} onGoProClick={() => handleOpenPurchaseModal('pro')} />
            </div>
          </div>
        )}
      </main>
      <Footer onShowPrivacyPolicy={showPrivacyPolicy} onShowTerms={showTerms} />
      {modalContent && <Modal title={modalContent.title} onClose={() => setModalContent(null)}><p className="text-sm text-slate-400 whitespace-pre-wrap">{modalContent.content}</p></Modal>}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showTermsModal && <TermsModal onAgree={handleTermsAgree} onCancel={() => setShowTermsModal(false)} />}
      {showPurchaseModal && (
        <Modal title={purchaseReason ? "Not Enough Credits" : "Get More From facestyle.fun"} onClose={closePurchaseModalAndReset}>
            <PayPalScriptProvider options={paypalOptions}>
                <div className="text-center">
                  {purchaseReason && !error && (<div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-500/40 rounded-xl"><p className="font-semibold text-yellow-200">{purchaseReason}</p></div>)}
                  {error && (<div className="mb-6 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg text-center"><p>{error}</p></div>)}
                  <div className="flex justify-center border-b border-gray-700 mb-6">
                    <button onClick={() => setPurchaseModalTab('credits')} className={`px-6 py-3 font-semibold transition-colors ${purchaseModalTab === 'credits' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}>Buy Credits</button>
                    <button onClick={() => setPurchaseModalTab('pro')} className={`px-6 py-3 font-semibold transition-colors ${purchaseModalTab === 'pro' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-400 hover:text-white'}`}>Go Pro</button>
                  </div>
                  <div className="relative min-h-[400px]">
                      <div className={`transition-opacity duration-300 ${paymentStatus !== 'idle' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                          {purchaseModalTab === 'credits' && (
                            <div>
                                <div className='flex flex-col gap-4 items-center'>
                                    <p className="text-slate-300 mb-4">Select a credit pack to continue creating your perfect look.</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                      {CREDIT_TIERS.map(tier => (<div key={tier.credits} className="relative">
                                            <button onClick={() => setSelectedTier(tier)} className={`relative p-6 rounded-xl border-2 transition-all duration-200 w-full text-center ${selectedTier?.credits === tier.credits ? 'border-cyan-400 bg-cyan-900/50 glow-border' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}>
                                                {tier.tag && (<span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${tier.tag === 'Most Popular' ? 'bg-cyan-400 text-black' : 'bg-yellow-400 text-black'}`}>{tier.tag}</span>)}
                                                <p className="text-2xl font-bold text-cyan-400">{tier.credits}</p><p className="text-slate-400 text-sm">Credits</p><p className="text-lg font-semibold mt-2">${tier.price}</p>
                                            </button></div>))}
                                    </div>
                                    <div className="w-full max-w-sm mt-6 mx-auto space-y-4">
                                      {arePaymentsConfigured ? (
                                        <>
                                          {selectedTier && PAYPAL_CLIENT_ID && (
                                            <PayPalButton amount={selectedTier.price} description={selectedTier.description} onSuccess={handlePaymentSuccess} onError={handlePayPalError} disabled={paymentStatus !== 'idle'} />
                                          )}
                                          {selectedTier && RAZORPAY_KEY_ID && (
                                            <RazorpayButton amount={selectedTier.price} description={selectedTier.description} onSuccess={handlePaymentSuccess} onError={handleRazorpayError} disabled={paymentStatus !== 'idle'} />
                                          )}
                                        </>
                                      ) : (
                                        <div className="p-4 bg-yellow-900/30 border border-yellow-500/40 rounded-xl text-yellow-200">
                                          <p className="font-semibold">Payments Unavailable</p>
                                          <p className="text-sm mt-1">Online payments are not configured for this site. Please contact support.</p>
                                        </div>
                                      )}
                                    </div>
                                </div>
                                <CouponRedeemer />
                            </div>)}
                          {purchaseModalTab === 'pro' && (
                            <div className="flex flex-col items-center gap-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                                <h3 className="text-2xl font-bold text-yellow-300">facestyle.fun PRO</h3>
                                <p className="text-slate-300">Unlock the ultimate creative experience.</p>
                                <ul className="text-left space-y-2 my-4 text-slate-300">
                                    <li className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><b>Permanent Cloud History</b> (Never lose a creation)</li>
                                    <li className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Unlimited AI Edits (No credit costs)</li>
                                    <li className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span className="text-slate-500">No Watermark (Coming Soon)</span></li>
                                </ul>
                                <div className="w-full max-w-sm mt-4 space-y-4">
                                  {arePaymentsConfigured ? (
                                    <>
                                      {PAYPAL_CLIENT_ID && (
                                        <PayPalButton amount={PRO_TIER.price} description={PRO_TIER.description} onSuccess={handleProSubscriptionSuccess} onError={handlePayPalError} disabled={paymentStatus !== 'idle'} />
                                      )}
                                      {RAZORPAY_KEY_ID && (
                                          <RazorpayButton amount={PRO_TIER.price} description={PRO_TIER.description} onSuccess={handleProSubscriptionSuccess} onError={handleRazorpayError} disabled={paymentStatus !== 'idle'} />
                                      )}
                                      <p className="text-xs text-slate-500 mt-2">Billed monthly. Cancel anytime.</p>
                                    </>
                                  ) : (
                                    <div className="p-4 bg-yellow-900/30 border border-yellow-500/40 rounded-xl text-yellow-200">
                                      <p className="font-semibold">Payments Unavailable</p>
                                      <p className="text-sm mt-1">Online payments are not configured for this site. Please contact support.</p>
                                    </div>
                                  )}
                                </div>
                            </div>)}
                      </div>
                      {paymentStatus === 'processing' && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 bg-gray-900 rounded-b-xl"><Spinner /><p className="text-lg animate-pulse text-cyan-300">Processing payment...</p></div>)}
                      {paymentStatus === 'success' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 bg-gray-900 rounded-b-xl">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <p className="text-lg text-green-300">Purchase Successful!</p>
                          <p className="text-sm text-slate-400">Your account has been updated.</p>
                          <Button onClick={closePurchaseModalAndReset} variant="primary" className="mt-4">Continue</Button>
                        </div>
                      )}
                  </div>
                </div>
            </PayPalScriptProvider>
        </Modal>
      )}
      <div style={{ position: 'fixed', bottom: '10px', right: '10px', backgroundColor: 'rgba(0, 255, 255, 0.2)', color: '#06b6d4', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', zIndex: 100, backdropFilter: 'blur(2px)' }}>
        v1.34
      </div>
    </div>
  );
};
export default App;