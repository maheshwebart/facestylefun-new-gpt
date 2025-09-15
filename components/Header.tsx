import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

interface HeaderProps {
    onBuyCreditsClick: () => void;
    onAuthClick: () => void;
    credits: number;
}

const Header: React.FC<HeaderProps> = ({ onBuyCreditsClick, onAuthClick, credits }) => {
    const { user, profile, signOut, loading } = useAuth();
    const isProUser = profile?.is_pro ?? false;

    return (
        <header className="bg-black/50 backdrop-blur-lg border-b border-cyan-500/20 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
                    facestyle.fun
                </h1>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-700">
                        {isProUser ? (
                            <span className="text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-md px-2 py-0.5">PRO</span>
                        ) : (
                            <>
                                <span className="font-bold text-lg text-yellow-400">{loading && !profile && !user ? '...' : credits}</span>
                                <span className="text-sm text-slate-400">Credits</span>
                            </>
                        )}
                    </div>

                    {loading ? (
                        <div className="w-24 h-9 flex items-center justify-center"><Spinner /></div>
                    ) : user ? (
                        <div className="flex items-center gap-2">
                            <button onClick={onBuyCreditsClick} className="px-3 py-1.5 text-sm font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-lg hover:bg-cyan-500/20 transition-colors">
                                Get Credits
                            </button>
                            <button onClick={signOut} className="px-3 py-1.5 text-sm font-semibold bg-gray-700/50 border border-gray-600/30 text-slate-300 rounded-lg hover:bg-gray-700 transition-colors">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button onClick={onAuthClick} className="px-4 py-2 text-sm font-semibold bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition-colors">
                            Login / Sign Up
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;