import React from 'react';
import Button from './Button';
import type { HistoryItem } from '../types';

interface HistoryPanelProps {
  history: HistoryItem[];
  isProUser: boolean;
  onLoadItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  onGoProClick: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, isProUser, onLoadItem, onClearHistory, onGoProClick }) => {
  return (
    <div className="w-full max-w-3xl mt-4 bg-gray-900/50 p-4 rounded-2xl border border-cyan-500/20">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-cyan-400">Creation History</h3>
        {history.length > 0 && (
          <Button onClick={onClearHistory} variant="secondary" className="!px-3 !py-1.5 !text-xs">
            Clear Local History
          </Button>
        )}
      </div>
      
      {!isProUser && (
        <div className="text-center p-3 mb-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-200">This is temporary session history.</p>
          <p className="text-xs text-yellow-400/80">
            <button onClick={onGoProClick} className="font-bold underline hover:text-white transition-colors">Go PRO</button> to save your creations to the cloud forever!
          </p>
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-slate-500">You haven't created any images in this session.</p>
          <p className="text-slate-600 text-sm">Your new creations will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-cyan-400 transition-colors"
              onClick={() => onLoadItem(item)}
              role="button"
              aria-label={`Load creation from ${item.timestamp}`}
            >
              <img src={item.editedImage} alt={`Creation from ${item.timestamp}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 text-center">
                <p className="text-xs font-bold text-cyan-300">Load</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;