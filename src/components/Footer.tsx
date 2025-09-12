import React from 'react';

interface FooterProps {
    onShowPrivacyPolicy: () => void;
    onShowTerms: () => void;
}

const Footer: React.FC<FooterProps> = ({ onShowPrivacyPolicy, onShowTerms }) => {
  return (
    <footer className="w-full py-4 mt-8 border-t border-cyan-500/10">
      <div className="container mx-auto px-4 text-center text-xs text-slate-500 flex justify-center items-center gap-6">
        <p>&copy; {new Date().getFullYear()} facestyle.fun. All Rights Reserved.</p>
        <button onClick={onShowTerms} className="hover:text-cyan-400 transition-colors">Terms of Service</button>
        <button onClick={onShowPrivacyPolicy} className="hover:text-cyan-400 transition-colors">Privacy Policy</button>
      </div>
    </footer>
  );
};

export default Footer;