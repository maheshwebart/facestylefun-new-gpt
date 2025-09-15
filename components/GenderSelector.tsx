import React from 'react';
import { Gender } from '../types';

interface GenderSelectorProps {
    selectedGender: Gender;
    onGenderChange: (gender: Gender) => void;
    disabled: boolean;
}

const GenderSelector: React.FC<GenderSelectorProps> = ({ selectedGender, onGenderChange, disabled }) => {
    const options: { id: Gender, label: string }[] = [
        { id: 'female', label: 'Female' },
        { id: 'male', label: 'Male' },
    ];

    return (
        <div className="w-full">
            <h3 className="text-md font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                Subject Gender
            </h3>
            <div className="flex items-center gap-2 bg-gray-800/60 border-2 border-gray-700 rounded-xl p-1">
                {options.map(option => (
                    <button
                        key={option.id}
                        onClick={() => onGenderChange(option.id)}
                        disabled={disabled}
                        className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ring-offset-2 ring-offset-gray-900 ${
                            selectedGender === option.id 
                                ? 'bg-cyan-500 text-black shadow-md' 
                                : 'bg-transparent text-slate-400 hover:bg-gray-700/50'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default GenderSelector;
