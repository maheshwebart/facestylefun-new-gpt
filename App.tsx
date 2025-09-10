import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { editImageWithGemini } from './services/geminiService';
import type { ImageData, HairStyle, BeardStyle, SunglassesStyle, CorrectionStyle, HairStyleId, BeardStyleId, SunglassesStyleId, CorrectionStyleId, HistoryItem } from './types';
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
import { 
  ShortAndNeatIcon, ModernFadeIcon, LongAndWavyIcon, CurlyTopIcon, BaldFadeIcon, AfroIcon, SlickedBackIcon,
  BobCutIcon, PonytailIcon, LongStraightIcon,
  FullBeardIcon, GoateeIcon, StubbleIcon, VanDykeIcon, MuttonChopsIcon,
  AviatorsIcon, WayfarersIcon, RoundIcon, SportyIcon, ClubmastersIcon,
  BrightenFaceIcon
} from './components/HairStyleIcons';

const HAIR_STYLES: HairStyle[] = [
  { id: 'short-and-neat', name: 'Short & Neat', prompt: 'a classic short and neat hairstyle', icon: ShortAndNeatIcon },
  { id: 'modern-fade', name: 'Modern Fade', prompt: 'a stylish modern fade hairstyle', icon: ModernFadeIcon },
  { id: 'long-and-wavy', name: 'Long & Wavy', prompt: 'a longer, wavy hairstyle for men', icon: LongAndWavyIcon },
  { id: 'curly-top', name: 'Curly Top', prompt: 'a curly top hairstyle', icon: CurlyTopIcon },
  { id: 'bald-fade', name: 'Bald Fade', prompt: 'a clean bald fade', icon: BaldFadeIcon },
  { id: 'afro', name: 'Afro', prompt: 'a natural afro hairstyle', icon: AfroIcon },
  { id: 'slicked-back', name: 'Slicked Back', prompt: 'a classic slicked back look', icon: SlickedBackIcon },
  { id: 'bob-cut', name: 'Bob Cut', prompt: `a classic women's bob cut hairstyle`, icon: BobCutIcon },
  { id: 'ponytail', name: 'Ponytail', prompt: `a sleek women's ponytail hairstyle`, icon: PonytailIcon },
  { id: 'long-straight', name: 'Long & Straight', prompt: `a long, straight women's hairstyle`, icon: LongStraightIcon },
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
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  const [credits, setCredits] = useState<number>(() => {
    const savedCredits = localStorage.getItem('userCredits');
    return savedCredits ? parseInt(savedCredits, 10) : 3;
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const savedHistory = localStorage.getItem('userHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (e) {
      console.error("Failed to parse history from localStorage", e);
      return [];
    }
  });

  const [isProUser, setIsProUser] = useState<boolean>(() => {
    return localStorage.getItem('isProUser') === 'true';
  });
  
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [purchaseModalTab, setPurchaseModalTab] = useState<'credits' | 'pro'>('credits');

  const [selectedTier, setSelectedTier] = useState<(typeof CREDIT_TIERS)[1] | null>(CREDIT_TIERS[1]); // Default to most popular
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  useEffect(() => {
    localStorage.setItem('userCredits', credits.toString());
  }, [credits]);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('userHistory', JSON.stringify(history));
    } else {
      localStorage.removeItem('userHistory');
    }
  }, [history]);
  
  useEffect(() => {
    localStorage.setItem('isProUser', String(isProUser));
  }, [isProUser]);

  const featureCount = useMemo(() => {
    const count = [
      selectedHairId,
      selectedBeardId,
      selectedSunglassesId,
      referenceImage,
      selectedCorrectionId,
      customPrompt.trim()
    ].filter(Boolean).length;
    return Math.max(1, count); // Cost is at least 1 credit
  }, [selectedHairId, selectedBeardId, selectedSunglassesId, referenceImage, selectedCorrectionId, customPrompt]);
  
  const addWatermark = (base64WithHeader: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context'));
            
            ctx.drawImage(img, 0, 0);
            
            const fontSize = Math.max(16, Math.round(img.width / 55));
            ctx.font = `bold ${fontSize}px 'Poppins', sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            const padding = Math.round(img.width / 80);
            ctx.fillText('facestyle.fun', canvas.width - padding, canvas.height - padding);
            
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(new Error('Failed to load image for watermarking'));
        img.src = base64WithHeader;
    });
  };

  const handleImageUpload = (file: File, type: 'original' | 'reference') => {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file (PNG, JPG, etc.).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const mimeType = file.type;
        const imageData = { base64: base64String.split(',')[1], mimeType: mimeType, name: file.name };
        
        if (type === 'original') {
            setOriginalImage(imageData);
            handleResetSelections();
        } else {
            setReferenceImage(imageData);
            setSelectedHairId(null);
        }
      };
      reader.onerror = () => setError(`Failed to read the ${type} image file.`);
      reader.readAsDataURL(file);
  }
  
  const executeImageEdit = async (cost: number, fullPrompt: string) => {
    if (!originalImage) return;
  
    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    try {
      const resultBase64 = await editImageWithGemini(originalImage, fullPrompt, referenceImage);
      const watermarkedImage = await addWatermark(`data:image/png;base64,${resultBase64}`);
      setEditedImage(watermarkedImage);
      if (!isProUser) { // Pro users have unlimited edits
        setCredits(prev => prev - cost);
      }
      
      const newHistoryItem: HistoryItem = {
        id: Date.now(),
        originalImage: originalImage,
        editedImage: watermarkedImage,
        prompt: fullPrompt,
        timestamp: new Date().toLocaleString(),
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApplyChanges = async () => {
    if (isLoading || !hasSelection) {
      if (!hasSelection) {
        setError("Please select at least one style, provide a reference image, or enter a custom adjustment to apply.");
      }
      return;
    }
    
    // Pro users don't spend credits
    if (isProUser) {
        // Proceed without credit check for pro users
    } else {
        const cost = featureCount;
        if (credits < cost) {
          const hasPurchased = localStorage.getItem('hasPurchasedCredits') === 'true';
          let errorMessage = `You need ${cost} credits for this edit, but you only have ${credits}. Please buy more to continue.`;
          if (!hasPurchased) {
            errorMessage = `Your free credits aren't enough for this amazing ${cost}-credit edit! Buy a credit pack to unlock all features.`;
          }
          setError(errorMessage);
          setPurchaseModalTab('credits');
          setShowPurchaseModal(true);
          return;
        }
    }


    let fullPrompt = '';
    const stylePrompts: string[] = [];
  
    if (selectedBeardId) {
      const selectedBeard = BEARD_STYLES.find(s => s.id === selectedBeardId);
      if (selectedBeard) stylePrompts.push(`add ${selectedBeard.prompt}`);
    }
    if (selectedSunglassesId) {
      const selectedSunglasses = SUNGLASSES_STYLES.find(s => s.id === selectedSunglassesId);
      if (selectedSunglasses) stylePrompts.push(`add ${selectedSunglasses.prompt}`);
    }
    if (selectedCorrectionId) {
      const selectedCorrection = CORRECTION_STYLES.find(s => s.id === selectedCorrectionId);
      if (selectedCorrection) stylePrompts.push(`${selectedCorrection.prompt}`);
    }
    if (customPrompt.trim()) {
      stylePrompts.push(customPrompt.trim());
    }
  
    if (referenceImage) {
      const hairstylePrompt = 'The first image is the main image of a person. The second image is a style reference. Apply the hairstyle from the second image to the person in the first image, correcting any hair loss.';
      if (stylePrompts.length > 0) {
        fullPrompt = `${hairstylePrompt} Additionally, apply the following changes to the person in the first image: ${stylePrompts.join(', ')}.`;
      } else {
        fullPrompt = hairstylePrompt;
      }
    } else {
      if (selectedHairId) {
        const selectedHair = HAIR_STYLES.find(s => s.id === selectedHairId);
        if (selectedHair) stylePrompts.unshift(`correct any hair loss and apply ${selectedHair.prompt}`);
      } else if (stylePrompts.length === 0) {
        stylePrompts.push('subtly enhance the person\'s existing hairstyle and correct any visible hair loss to create a fuller, more styled look.');
      }
      
      fullPrompt = `For the person in the image, apply the following changes: ${stylePrompts.join(', ')}.`;
    }
    
    fullPrompt += ' Ensure the final result looks natural and realistic, seamlessly blending with the person\'s original features and lighting.';

    await executeImageEdit(isProUser ? 0 : featureCount, fullPrompt);
  };
  
  const handlePaymentSuccess = (creditsToAdd: number) => {
    setPaymentStatus('success');
    localStorage.setItem('hasPurchasedCredits', 'true');
    setTimeout(() => {
      setCredits(prev => prev + creditsToAdd);
      setShowPurchaseModal(false);
      setSelectedTier(CREDIT_TIERS[1]);
      setPaymentStatus('idle');
      setError(null);
    }, 2000);
  };
  
  const handleProSubscriptionSuccess = () => {
    setPaymentStatus('success');
    setTimeout(() => {
        setIsProUser(true);
        setShowPurchaseModal(false);
        setPaymentStatus('idle');
        setError(null);
    }, 2000);
  };

  const handleOpenPurchaseModal = (tab: 'credits' | 'pro' = 'credits') => {
    setPurchaseModalTab(tab);
    setShowPurchaseModal(true);
    setPaymentStatus('idle');
    setSelectedTier(CREDIT_TIERS[1]);
  }
  
  const handleResetSelections = useCallback(() => {
      setEditedImage(null);
      setError(null);
      setReferenceImage(null);
      setSelectedHairId(null);
      setSelectedBeardId(null);
      setSelectedSunglassesId(null);
      setSelectedCorrectionId(null);
      setCustomPrompt('');
  }, []);

  const handleStartOver = () => {
    setOriginalImage(null);
    setIsLoading(false);
    handleResetSelections();
  };
  
  const handleDownload = () => {
    if (!editedImage) return;
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = `facestyle.fun-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const onHairStyleSelect = (style: HairStyle | null) => {
    if (style) {
        setReferenceImage(null);
        setSelectedHairId(style.id as HairStyleId);
    } else {
        setSelectedHairId(null);
    }
  };
  
  const handleLoadHistoryItem = (item: HistoryItem) => {
    handleResetSelections();
    setOriginalImage(item.originalImage);
    setEditedImage(item.editedImage);
  };
  
  const handleClearHistory = () => {
    setHistory([]);
  };

  const hasSelection = Boolean(selectedHairId || selectedBeardId || selectedSunglassesId || referenceImage || selectedCorrectionId || customPrompt.trim());

  const showPrivacyPolicy = () => setModalContent({ title: 'Privacy Policy', content: PRIVACY_POLICY });
  const showTerms = () => setModalContent({ title: 'Terms of Service', content: TERMS_OF_SERVICE });

  const getButtonText = () => {
    if (isLoading) return 'Applying...';
    if (isProUser) return 'Apply Changes (Pro)';
    return `Apply Changes (${featureCount} Credit${featureCount > 1 ? 's' : ''})`;
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans flex flex-col">
      <Header 
        credits={credits} 
        isProUser={isProUser}
        onBuyCreditsClick={() => handleOpenPurchaseModal('credits')} 
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {!originalImage ? (
          <ImageUpload onImageUpload={(e) => e.target.files && handleImageUpload(e.target.files[0], 'original')} error={error} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-2xl border border-cyan-500/20 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-cyan-400">Style Editor</h2>
                    <button onClick={() => handleOpenPurchaseModal('pro')} className="text-xs font-semibold bg-yellow-400/10 text-yellow-300 px-2 py-1 rounded-md border border-yellow-400/20 hover:bg-yellow-400/20 transition-colors">
                        Go PRO
                    </button>
                </div>
                <HairStyleSelector title="Hairstyle" styles={HAIR_STYLES} selectedStyleId={selectedHairId} onStyleSelect={(style) => onHairStyleSelect(style as HairStyle | null)} disabled={isLoading || !!referenceImage} />
                <ReferenceImageUpload referenceImage={referenceImage} onImageUpload={(e) => e.target.files && handleImageUpload(e.target.files[0], 'reference')} onRemoveImage={() => setReferenceImage(null)} disabled={isLoading} />
                <HairStyleSelector title="Beard" styles={BEARD_STYLES} selectedStyleId={selectedBeardId} onStyleSelect={(style) => setSelectedBeardId(style ? style.id as BeardStyleId : null)} disabled={isLoading} />
                <HairStyleSelector title="Sunglasses" styles={SUNGLASSES_STYLES} selectedStyleId={selectedSunglassesId} onStyleSelect={(style) => setSelectedSunglassesId(style ? style.id as SunglassesStyleId : null)} disabled={isLoading} />
                <HairStyleSelector title="Corrections" styles={CORRECTION_STYLES} selectedStyleId={selectedCorrectionId} onStyleSelect={(style) => setSelectedCorrectionId(style ? style.id as CorrectionStyleId : null)} disabled={isLoading} />
                <CustomPromptInput value={customPrompt} onChange={setCustomPrompt} disabled={isLoading} />
            </div>

            <div className="lg:col-span-2 flex flex-col items-center justify-center gap-6">
                <div className="w-full max-w-3xl relative">
                    <ImageComparator
                        before={originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : ''}
                        after={editedImage}
                        isLoading={isLoading}
                    />
                     {isLoading && (
                       <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-2xl z-20 backdrop-blur-sm">
                         <Spinner />
                         <p className="mt-4 text-lg animate-pulse text-cyan-300">AI is working its magic...</p>
                         <p className="text-sm text-slate-400 mt-1">This may take a moment.</p>
                       </div>
                     )}
                </div>
                
                {error && (
                   <div className="w-full max-w-3xl p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg text-center">
                     <p className="font-bold">Heads up!</p>
                     <p>{error}</p>
                   </div>
                )}
                
                <div className="flex justify-center items-center gap-4 flex-wrap">
                   <Button onClick={handleApplyChanges} variant="primary" disabled={isLoading || !hasSelection}>
                    {getButtonText()}
                  </Button>
                  {editedImage && (
                    <>
                      <Button onClick={handleDownload} variant="primary" disabled={isLoading}>
                        Download Image
                      </Button>
                      <ShareButtons imageSrc={editedImage} />
                    </>
                  )}
                   <Button onClick={handleStartOver} variant="secondary" disabled={isLoading}>
                    Start Over
                  </Button>
                </div>
                <HistoryPanel
                  history={history}
                  isProUser={isProUser}
                  onLoadItem={handleLoadHistoryItem}
                  onClearHistory={handleClearHistory}
                  onGoProClick={() => handleOpenPurchaseModal('pro')}
                />
            </div>
          </div>
        )}
      </main>
      <Footer onShowPrivacyPolicy={showPrivacyPolicy} onShowTerms={showTerms} />
      {modalContent && (
        <Modal title={modalContent.title} onClose={() => setModalContent(null)}>
          <p className="text-sm text-slate-400 whitespace-pre-wrap">{modalContent.content}</p>
        </Modal>
      )}
      {showPurchaseModal && (
        <Modal title="Get More From facestyle.fun" onClose={() => !isLoading && paymentStatus !== 'processing' && setShowPurchaseModal(false)}>
            <div className="text-center">
              <div className="flex justify-center border-b border-gray-700 mb-6">
                <button onClick={() => setPurchaseModalTab('credits')} className={`px-6 py-3 font-semibold transition-colors ${purchaseModalTab === 'credits' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}>Buy Credits</button>
                <button onClick={() => setPurchaseModalTab('pro')} className={`px-6 py-3 font-semibold transition-colors ${purchaseModalTab === 'pro' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-400 hover:text-white'}`}>Go Pro</button>
              </div>

                {paymentStatus === 'idle' && (
                    <>
                    {purchaseModalTab === 'credits' && (
                      <div className='flex flex-col gap-4 items-center'>
                          <p className="text-slate-300 mb-4">Select a credit pack to continue creating your perfect look.</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                            {CREDIT_TIERS.map(tier => (
                                <div key={tier.credits} className="relative">
                                  <button 
                                    onClick={() => setSelectedTier(tier)}
                                    className={`relative p-6 rounded-xl border-2 transition-all duration-200 w-full text-center ${selectedTier?.credits === tier.credits ? 'border-cyan-400 bg-cyan-900/50 glow-border' : 'border-gray-700 bg-gray-800 hover:border-gray-500'}`}
                                  >
                                      {tier.tag && (
                                        <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${tier.tag === 'Most Popular' ? 'bg-cyan-400 text-black' : 'bg-yellow-400 text-black'}`}>
                                            {tier.tag}
                                        </span>
                                      )}
                                      <p className="text-2xl font-bold text-cyan-400">{tier.credits}</p>
                                      <p className="text-slate-400 text-sm">Credits</p>
                                      <p className="text-lg font-semibold mt-2">${tier.price}</p>
                                  </button>
                                </div>
                            ))}
                          </div>
                          {selectedTier && (
                            <div className="w-full max-w-sm mt-6">
                              <PayPalButton 
                                amount={selectedTier.price}
                                description={selectedTier.description}
                                onSuccess={() => handlePaymentSuccess(selectedTier.credits)}
                                onError={(err) => {
                                  setError(`PayPal Error: ${err}`);
                                  setShowPurchaseModal(false);
                                }}
                                onProcessing={() => setPaymentStatus('processing')}
                              />
                            </div>
                          )}
                      </div>
                    )}
                    {purchaseModalTab === 'pro' && (
                      <div className="flex flex-col items-center gap-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                          <h3 className="text-2xl font-bold text-yellow-300">facestyle.fun PRO</h3>
                          <p className="text-slate-300">Unlock the ultimate creative experience.</p>
                          <ul className="text-left space-y-2 my-4 text-slate-300">
                              <li className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><b>Permanent Cloud History</b> (Never lose a creation)</li>
                              <li className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Unlimited AI Edits (No credit costs)</li>
                              <li className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span className="text-slate-500">No Watermark (Coming Soon)</span></li>
                              <li className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg><span className="text-slate-500">Priority Support (Coming Soon)</span></li>
                          </ul>
                          <div className="w-full max-w-sm mt-4">
                            <PayPalButton 
                                amount={PRO_TIER.price}
                                description={PRO_TIER.description}
                                onSuccess={() => handleProSubscriptionSuccess()}
                                onError={(err) => {
                                  setError(`PayPal Error: ${err}`);
                                  setShowPurchaseModal(false);
                                }}
                                onProcessing={() => setPaymentStatus('processing')}
                              />
                              <p className="text-xs text-slate-500 mt-2">Billed monthly. Cancel anytime.</p>
                          </div>
                      </div>
                    )}
                    </>
                )}
                {paymentStatus === 'processing' && (
                    <div className="flex flex-col items-center justify-center gap-4 p-8">
                        <Spinner />
                        <p className="text-lg animate-pulse text-cyan-300">Processing payment...</p>
                    </div>
                )}
                {paymentStatus === 'success' && (
                    <div className="flex flex-col items-center justify-center gap-4 p-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg text-green-300">Purchase Successful!</p>
                        <p className="text-sm text-slate-400">Your account has been updated.</p>
                    </div>
                )}
            </div>
        </Modal>
      )}
    </div>
  );
};

export default App;