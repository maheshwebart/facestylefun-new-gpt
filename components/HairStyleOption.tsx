import React from 'react';
import type { Style } from '../types';

interface StyleOptionProps {
  styleInfo: Style<string>;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}

const HairStyleOption: React.FC<StyleOptionProps> = ({ styleInfo, isSelected, onClick, disabled }) => {
  const Icon = styleInfo.icon;

  const baseClasses = "flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 focus:outline-none w-full h-full aspect-square";
  const selectedClasses = "bg-cyan-900/50 border-2 border-cyan-400 text-cyan-300 glow-border";
  const unselectedClasses = "bg-gray-800/60 border-2 border-gray-700 hover:border-gray-500 text-slate-400 hover:text-white";
  const disabledClasses = "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses} ${disabledClasses}`}
      aria-label={`Apply ${styleInfo.name} style`}
      aria-pressed={isSelected}
    >
      <Icon className="w-8 h-8 mb-1" />
      <span className="text-[10px] font-medium text-center leading-tight">{styleInfo.name}</span>
    </button>
  );
};

export default HairStyleOption;