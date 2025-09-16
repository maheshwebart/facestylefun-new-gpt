
import React from 'react';

/**
 * NOTE: This file has been repurposed to house the AiBrainSpinner component
 * to meet project file structure constraints. It provides a themed loading indicator.
 */
const AiBrainSpinner: React.FC = () => {
    return (
        <div className="w-24 h-24 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Brain outline */}
                <path
                    d="M 50,10 C 25,10 15,30 15,50 C 15,70 25,90 50,90 C 75,90 85,70 85,50 C 85,30 75,10 50,10 Z M 50,15 C 70,15 80,30 80,50 C 80,70 70,85 50,85 C 30,85 20,70 20,50 C 20,30 30,15 50,15 Z"
                    fill="none"
                    stroke="rgba(6, 182, 212, 0.2)"
                    strokeWidth="2"
                />
                <path
                    d="M 50,10 C 25,10 15,30 15,50 C 15,70 25,90 50,90"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeDasharray="150 150"
                    className="animate-brain-draw"
                />

                {/* Nodes */}
                <circle cx="50" cy="10" r="3" fill="#a855f7" className="animate-node-pulse" style={{ animationDelay: '0s' }} />
                <circle cx="15" cy="50" r="3" fill="#a855f7" className="animate-node-pulse" style={{ animationDelay: '0.2s' }} />
                <circle cx="50" cy="90" r="3" fill="#a855f7" className="animate-node-pulse" style={{ animationDelay: '0.4s' }} />
                <circle cx="85" cy="50" r="3" fill="#a855f7" className="animate-node-pulse" style={{ animationDelay: '0.6s' }} />
                <circle cx="30" cy="25" r="3" fill="#06b6d4" className="animate-node-pulse" style={{ animationDelay: '0.8s' }} />
                <circle cx="70" cy="25" r="3" fill="#06b6d4" className="animate-node-pulse" style={{ animationDelay: '1s' }} />
                <circle cx="30" cy="75" r="3" fill="#06b6d4" className="animate-node-pulse" style={{ animationDelay: '1.2s' }} />
                <circle cx="70" cy="75" r="3" fill="#06b6d4" className="animate-node-pulse" style={{ animationDelay: '1.4s' }} />
            </svg>
        </div>
    );
};

export default AiBrainSpinner;