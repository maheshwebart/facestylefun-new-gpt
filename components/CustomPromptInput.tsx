import React from 'react';

interface CustomPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const CustomPromptInput: React.FC<CustomPromptInputProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="w-full">
      <h3 className="text-md font-semibold text-cyan-400 mb-3">Custom Adjustments</h3>
      <p className="text-xs text-slate-500 mb-3">Describe face or make-up changes. e.g., "add red lipstick", "make them smile subtly".</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={3}
        className="w-full bg-gray-800/60 border-2 border-gray-700 rounded-xl p-3 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        placeholder="Type your adjustments here..."
        aria-label="Custom adjustments for face and make-up"
      />
    </div>
  );
};

export default CustomPromptInput;
