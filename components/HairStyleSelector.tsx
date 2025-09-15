import React from 'react';
import HairStyleOption from './HairStyleOption';
import type { Style } from '../types';

interface StyleSelectorProps {
  title: string;
  styles: Style<string>[];
  selectedStyleId: string | null;
  onStyleSelect: (style: Style<string> | null) => void;
  disabled: boolean;
}

const HairStyleSelector: React.FC<StyleSelectorProps> = ({ title, styles, selectedStyleId, onStyleSelect, disabled }) => {
  return (
    <div className="w-full">
        <h3 className="text-md font-semibold text-cyan-400 mb-3">{title}</h3>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {styles.map((style) => (
                <HairStyleOption
                    key={style.id}
                    styleInfo={style}
                    isSelected={selectedStyleId === style.id}
                    onClick={() => onStyleSelect(selectedStyleId === style.id ? null : style)}
                    disabled={disabled}
                />
            ))}
        </div>
    </div>
  );
};

export default HairStyleSelector;