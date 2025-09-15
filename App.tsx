import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { editImageWithGemini, detectGenderWithGemini } from './services/geminiService';
import type { ImageData, HairStyle, BeardStyle, SunglassesStyle, CorrectionStyle, HairStyleId, BeardStyleId, SunglassesStyleId, CorrectionStyleId, HistoryItem, Gender } from './types';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import ReferenceImageUpload from './components/ReferenceImageUpload';
import Button from './components/Button';
import Spinner from './components/Spinner';
import HairStyleSelector from './components/HairStyleSelector';
import ImageComparator from './components/ImageComparator';
import Footer from './components/Footer';
import Modal from './components/Modal';
import CustomPromptInput from './components/CustomPromptInput';
import PayPalButton from './components/PayPalButton';
import ShareButtons from './components/ShareButtons';
import HistoryPanel from './components/HistoryPanel';
import AuthModal from './components/AuthModal';
import TermsModal from './components/TermsModal';
import GenderSelector from './components/GenderSelector';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './services/supabaseClient';
import CouponRedeemer from './components/CouponRedeemer';

import {
  ShortAndNeatIcon, ModernFadeIcon, LongAndWavyIcon, CurlyTopIcon, BaldFadeIcon, AfroIcon, SlickedBackIcon,
  BobCutIcon, PonytailIcon, LongStraightIcon, PixieCutIcon, ShagCutIcon, BraidsIcon, UpdoIcon,
  FullBeardIcon, GoateeIcon, StubbleIcon, VanDykeIcon, MuttonChopsIcon,
  AviatorsIcon, WayfarersIcon, RoundIcon, SportyIcon, ClubmastersIcon,
  BrightenFaceIcon
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
const CORRECTION_STYLES: CorrectionStyle[] = [
  { id: 'face-brighten', name: 'Brighten Face', prompt: 'subtly brighten the lighting on the person\'s face', icon: BrightenFaceIcon },
];
const PRIVACY_POLICY = "Your privacy is important to us. When you upload an image, it is sent to Google's Gemini API for processing. We do not store your images on our servers after the editing process is complete. The generated image is available for you to download directly and is not retained by us. By using this service, you agree to Google's API terms of service and privacy policy.";
const TERMS_OF_SERVICE = "This service is provided for entertainment purposes. You are responsible for the images you upload and must have the necessary rights to use them. Do not upload content that is illegal, offensive, or infringes on the rights of others. We are not liable for any misuse of this service or for the content generated. The service is provided 'as is' without warranties of any kind. We reserve the right to change or discontinue the service at any time.";

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
  const { user, profile, updateProfile } = useAuth();

  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [referenceImage, setReferenceImage] = useState<ImageData | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDetectingGender, setIsDetectingGender] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<{ title: string, content: string } | null>(null);

  const [selectedHairId, setSelectedHairId] = useState<HairStyleId | null>(null);
  const [selectedBeardId, setSelectedBeardId] = useState<BeardStyleId | null>(null);
  const [selectedSunglassesId, setSelectedSunglassesId] = useState<SunglassesStyleId | null>(null);
  const [selectedCorrectionId, setSelectedCorrectionId] = useState<CorrectionStyleId | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [gender, setGender] = useState<Gender>('auto');
  const [detectedGender, setDetectedGender] = useState<'male' | 'female' | null>(null);

  const [localHistory, setLocalHistory] = useState<HistoryItem[]>(() => {
    try {
      const savedHistory = localStorage.getItem('userHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (e) { return []; }
  });
  const [cloudHistory, setCloudHistory] = useState<HistoryItem[]>([]);

  const isProUser = profile?.is_pro ?? false;

  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [purchaseModalTab, setPurchaseModalTab] = useState<'credits' | 'pro'>('credits');
  const [purchaseReason, setPurchaseReason] = useState<string | null>(null);

  const [selectedTier, setSelectedTier] = useState<(typeof CREDIT_TIERS)[1] | null>(CREDIT_TIERS[1]);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { // Only use local storage for guests
      try {
        localStorage.setItem('userHistory', JSON.stringify(localHistory));
      } catch (e) {
        // This is a critical error handler. If localStorage is full, it will crash the app.
        // We catch the error, remove the oldest history item, and let the state update trigger a new save attempt.
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
          console.warn("LocalStorage quota exceeded. Removing oldest history item to make space.");
          setLocalHistory(prev => prev.slice(0, prev.length - 1));
        } else {
          console.error("Failed to save history to localStorage:", e);
        }
      }
    } else { // Clear local history on login
      if (localStorage.getItem('userHistory')) {
        localStorage.removeItem('userHistory');
      }
      if (localHistory.length > 0) {
        setLocalHistory([]);
      }
    }
  }, [localHistory, user]);

  useEffect(() => {
    const fetchCloudHistory = async () => {
      if (!user || !supabase) return;
      try {
        const { data, error } = await supabase.from('creations').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
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

  const handleGenderDetection = async (image: ImageData) => {
    const cost = 1;
    if (!isProUser) {
      const guestCredits = parseInt(localStorage.getItem('guestCredits') || '3', 10);
      const currentCredits = profile?.credits ?? guestCredits;
      if (currentCredits < cost) {
        setError(`You need 1 credit for AI Gender Detection. Please top up or select a gender manually.`);
        return;
      }
    }
    setIsDetectingGender(true);
    setError(null);
    try {
      const result = await detectGenderWithGemini(image);
      setDetectedGender(result);
      if (!isProUser) {
        const guestCredits = parseInt(localStorage.getItem('guestCredits') || '3', 10);
        const currentCredits = profile?.credits ?? guestCredits;
        const newCredits = currentCredits - cost;
        if (user && profile) {
          await updateProfile({ credits: newCredits });
        } else {
          localStorage.setItem('guestCredits', newCredits.toString());
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown gender detection error.');
    } finally {
      setIsDetectingGender(false);
    }
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
        setDetectedGender(null);
        setGender('auto');
        await handleGenderDetection(imageData);
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
    setIsLoading(true); setError(null); setEditedImage(null);
    try {
      const resultBase64 = await editImageWithGemini(originalImage, fullPrompt, referenceImage);
      const watermarkedImage = await addWatermark(`data:image/png;base64,${resultBase64}`);
      setEditedImage(watermarkedImage);

      if (!isProUser) {
        const guestCredits = parseInt(localStorage.getItem('guestCredits') || '3', 10);
        const currentCredits = profile?.credits ?? guestCredits;
        const newCredits = currentCredits - cost;
        if (user && profile) {
          await updateProfile({ credits: newCredits });
        } else {
          localStorage.setItem('guestCredits', newCredits.toString());
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
        setLocalHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const featureCount = useMemo(() => {
    const count = [selectedHairId, selectedBeardId, selectedSunglassesId, referenceImage, selectedCorrectionId, customPrompt.trim()].filter(Boolean).length;
    return Math.max(1, count);
  }, [selectedHairId, selectedBeardId, selectedSunglassesId, referenceImage, selectedCorrectionId, customPrompt]);

  const effectiveGender = gender === 'auto' ? detectedGender : gender;

  const handleApplyChanges = async () => {
    if (isLoading || !hasSelection) { if (!hasSelection) setError("Please select at least one style to apply."); return; }
    if (gender === 'auto' && !detectedGender) { setError("Please wait for gender detection to complete, or select a gender manually."); return; }

    const cost = isProUser ? 0 : featureCount;
    const guestCredits = parseInt(localStorage.getItem('guestCredits') || '3', 10);
    const currentCredits = profile?.credits ?? guestCredits;

    if (currentCredits < cost) {
      let reason = `You need ${cost} credit${cost > 1 ? 's' : ''} for this edit, but you only have ${currentCredits}. Please top up.`;
      if (!user) reason = `Your free guest credits are not enough for this ${cost}-credit edit. Please sign in or buy a credit pack.`
      setPurchaseReason(reason); setError(null); setPurchaseModalTab('credits'); setShowPurchaseModal(true); return;
    }

    let fullPrompt = ''; const stylePrompts: string[] = [];
    if (selectedBeardId && effectiveGender === 'male') stylePrompts.push(`add ${BEARD_STYLES.find(s => s.id === selectedBeardId)?.prompt}`);
    if (selectedSunglassesId) stylePrompts.push(`add ${SUNGLASSES_STYLES.find(s => s.id === selectedSunglassesId)?.prompt}`);
    if (selectedCorrectionId) stylePrompts.push(`${CORRECTION_STYLES.find(s => s.id === selectedCorrectionId)?.prompt}`);
    if (customPrompt.trim()) stylePrompts.push(customPrompt.trim());

    const hairStyles = effectiveGender === 'male' ? MALE_HAIR_STYLES : FEMALE_HAIR_STYLES;
    if (referenceImage) {
      const hairstylePrompt = `The first image is the main image of a person. The second image is a style reference. Apply the hairstyle from the second image to the person in the first image, correcting any hair loss. The person is a ${effectiveGender}.`;
      fullPrompt = stylePrompts.length > 0 ? `${hairstylePrompt} Additionally, apply the following changes: ${stylePrompts.join(', ')}.` : hairstylePrompt;
    } else {
      if (selectedHairId) stylePrompts.unshift(`correct any hair loss and apply ${hairStyles.find(s => s.id === selectedHairId)?.prompt}`);
      else if (stylePrompts.length === 0) stylePrompts.push('subtly enhance the person\'s existing hairstyle and correct any visible hair loss to create a fuller, more styled look.');
      fullPrompt = `For the ${effectiveGender} in the image, apply the following changes: ${stylePrompts.join(', ')}.`;
    }
    fullPrompt += ' Ensure the final result looks natural and realistic, seamlessly blending with the person\'s original features and lighting.';
    await executeImageEdit(cost, fullPrompt);
  };

  const handlePaymentSuccess = async (creditsToAdd: number) => {
    setPaymentStatus('success');
    if (user && profile) {
      try {
        await updateProfile({ credits: profile.credits + creditsToAdd });
      } catch (err) {
        const errorMessage = err instanceof Error ? `Failed to update credits: ${err.message}` : 'An unknown error occurred while updating your profile.';
        setError(errorMessage);
        setPaymentStatus('idle'); // Reset payment status on error
        return;
      }
    } else {
      setShowPurchaseModal(false);
      setShowAuthModal(true);
      setError("Please sign in to add credits to your account.");
      return;
    }
    setTimeout(() => { setShowPurchaseModal(false); setSelectedTier(CREDIT_TIERS[1]); setPaymentStatus('idle'); setError(null); setPurchaseReason(null); }, 2000);
  };

  const handleProSubscriptionSuccess = async () => {
    setPaymentStatus('success');
    if (user && profile) {
      try {
        await updateProfile({ is_pro: true });
      } catch (err) {
        const errorMessage = err instanceof Error ? `Failed to activate Pro plan: ${err.message}` : 'An unknown error occurred while activating your Pro plan.';
        setError(errorMessage);
        setPaymentStatus('idle'); // Reset payment status on error
        return;
      }
    } else {
      setShowPurchaseModal(false);
      setShowAuthModal(true);
      setError("Please sign in to activate your Pro subscription.");
      return;
    }
    setTimeout(() => { setShowPurchaseModal(false); setPaymentStatus('idle'); setError(null); setPurchaseReason(null); }, 2000);
  };

  const handleOpenPurchaseModal = (tab: 'credits' | 'pro' = 'credits') => {
    setPurchaseReason(null); setPurchaseModalTab(tab); setShowPurchaseModal(true); setPaymentStatus('idle'); setSelectedTier(CREDIT_TIERS[1]);
  }

  const handleClosePurchaseModal = () => { if (!isLoading && paymentStatus !== 'processing') { setShowPurchaseModal(false); setPurchaseReason(null); } };

  const handleResetSelections = useCallback(() => {
    setEditedImage(null); setError(null); setReferenceImage(null); setSelectedHairId(null); setSelectedBeardId(null);
    setSelectedSunglassesId(null); setSelectedCorrectionId(null); setCustomPrompt('');
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

  const hasSelection = Boolean(selectedHairId || selectedBeardId || selectedSunglassesId || referenceImage || selectedCorrectionId || customPrompt.trim());
  const showPrivacyPolicy = () => setModalContent({ title: 'Privacy Policy', content: PRIVACY_POLICY });
  const showTerms = () => setModalContent({ title: 'Terms of Service', content: TERMS_OF_SERVICE });
  const getButtonText = () => {
    if (isLoading) return 'Applying...'; if (isProUser) return 'Apply Changes (Pro)';
    const cost = featureCount;
    return `Apply Changes (${cost} Credit${cost > 1 ? 's' : ''})`;
  }
  const historyToShow = isProUser ? cloudHistory : localHistory;
  const hairStylesToShow = effectiveGender === 'male' ? MALE_HAIR_STYLES : FEMALE_HAIR_STYLES;

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans flex flex-col">
      <Header onAuthClick={() => setShowAuthModal(true)} onBuyCreditsClick={() => handleOpenPurchaseModal('credits')} />
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
              <GenderSelector selectedGender={gender} onGenderChange={handleGenderChange} disabled={isLoading} isDetecting={isDetectingGender} />
              <HairStyleSelector title="Hairstyle" styles={hairStylesToShow} selectedStyleId={selectedHairId} onStyleSelect={(style) => onHairStyleSelect(style as HairStyle | null)} disabled={isLoading || !!referenceImage || !effectiveGender} />
              <ReferenceImageUpload referenceImage={referenceImage} onImageUpload={(e) => e.target.files && processImageFile(e.target.files[0], 'reference')} onRemoveImage={() => setReferenceImage(null)} disabled={isLoading || !effectiveGender} />
              {effectiveGender === 'male' && <HairStyleSelector title="Beard" styles={BEARD_STYLES} selectedStyleId={selectedBeardId} onStyleSelect={(style) => setSelectedBeardId(style ? style.id as BeardStyleId : null)} disabled={isLoading} />}
              <HairStyleSelector title="Sunglasses" styles={SUNGLASSES_STYLES} selectedStyleId={selectedSunglassesId} onStyleSelect={(style) => setSelectedSunglassesId(style ? style.id as SunglassesStyleId : null)} disabled={isLoading} />
              <HairStyleSelector title="Corrections" styles={CORRECTION_STYLES} selectedStyleId={selectedCorrectionId} onStyleSelect={(style) => setSelectedCorrectionId(style ? style.id as CorrectionStyleId : null)} disabled={isLoading} />
              <CustomPromptInput value={customPrompt} onChange={setCustomPrompt} disabled={isLoading} />
            </div>

            <div className="lg:col-span-2 flex flex-col items-center justify-center gap-6">
              <div className="w-full max-w-3xl relative">
                <ImageComparator before={originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : ''} after={editedImage} isLoading={isLoading} />
                {isLoading && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-2xl z-20 backdrop-blur-sm">
                    <Spinner />
                    <p className="mt-4 text-lg animate-pulse text-cyan-300">AI is working its magic...</p>
                    <p className="text-sm text-slate-400 mt-1">This may take a moment.</p>
                  </div>
                )}
              </div>
              {error && (<div className="w-full max-w-3xl p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg text-center"><p className="font-bold">Heads up!</p><p>{error}</p></div>)}
              <div className="flex justify-center items-center gap-4 flex-wrap">
                <Button onClick={handleApplyChanges} variant="primary" disabled={isLoading || !hasSelection}> {getButtonText()} </Button>
                {editedImage && (<><Button onClick={handleDownload} variant="primary" disabled={isLoading}> Download Image </Button><ShareButtons imageSrc={editedImage} /></>)}
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
        <Modal title={purchaseReason ? "Not Enough Credits" : "Get More From facestyle.fun"} onClose={handleClosePurchaseModal}>
          <div className="text-center">
            {purchaseReason && (<div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-500/40 rounded-xl"><p className="font-semibold text-yellow-200">{purchaseReason}</p></div>)}
            <div className="flex justify-center border-b border-gray-700 mb-6">
              <button onClick={() => setPurchaseModalTab('credits')} className={`px-6 py-3 font-semibold transition-colors ${purchaseModalTab === 'credits' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}>Buy Credits</button>
              <button onClick={() => setPurchaseModalTab('pro')} className={`px-6 py-3 font-semibold transition-colors ${purchaseModalTab === 'pro' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-400 hover:text-white'}`}>Go Pro</button>
            </div>
            {paymentStatus === 'idle' && (<>
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
                    {selectedTier && (<div className="w-full max-w-sm mt-6">
                      <PayPalButton amount={selectedTier.price} description={selectedTier.description} onSuccess={() => handlePaymentSuccess(selectedTier.credits)} onError={(err) => { setError(`PayPal Error: ${err}`); setShowPurchaseModal(false); }} onProcessing={() => setPaymentStatus('processing')} />
                    </div>)}
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
                  <div className="w-full max-w-sm mt-4">
                    <PayPalButton amount={PRO_TIER.price} description={PRO_TIER.description} onSuccess={() => handleProSubscriptionSuccess()} onError={(err) => { setError(`PayPal Error: ${err}`); setShowPurchaseModal(false); }} onProcessing={() => setPaymentStatus('processing')} />
                    <p className="text-xs text-slate-500 mt-2">Billed monthly. Cancel anytime.</p>
                  </div>
                </div>)}
            </>)}
            {paymentStatus === 'processing' && (<div className="flex flex-col items-center justify-center gap-4 p-8"><Spinner /><p className="text-lg animate-pulse text-cyan-300">Processing payment...</p></div>)}
            {paymentStatus === 'success' && (<div className="flex flex-col items-center justify-center gap-4 p-8"><svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><p className="text-lg text-green-300">Purchase Successful!</p><p className="text-sm text-slate-400">Your account has been updated.</p></div>)}
          </div>
        </Modal>
      )}
    </div>
  );
};
export default App;