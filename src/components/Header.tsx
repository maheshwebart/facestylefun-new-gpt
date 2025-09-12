import React from 'react';

interface HeaderProps {
    credits: number;
    isProUser: boolean;
    onBuyCreditsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ credits, isProUser, onBuyCreditsClick }) => {
  return (
    <header className="bg-black/50 backdrop-blur-lg border-b border-cyan-500/20 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
          facestyle.fun
        </h1>
        <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
                {isProUser ? (
                    <span className="px-2 py-0.5 text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-md">PRO</span>
                ) : (
                    <>
                        <span className="font-bold text-lg text-yellow-400">{credits}</span>
                        <span className="text-sm text-slate-400">Credits</span>
                    </>
                )}
            </div>
            <button onClick={onBuyCreditsClick} className="px-4 py-2 text-sm font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-lg hover:bg-cyan-500/20 transition-colors">
                Buy Credits
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;