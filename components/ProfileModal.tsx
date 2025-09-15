import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';

interface ProfileModalProps {
    onClose: () => void;
    onGoProClick: () => void;
    onBuyCreditsClick: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, onGoProClick, onBuyCreditsClick }) => {
    const { user, profile } = useAuth();

    if (!user || !profile) {
        return null;
    }

    const membershipStatus = profile.is_pro ? 'PRO Member' : 'Standard Member';
    const membershipColor = profile.is_pro ? 'text-yellow-300' : 'text-cyan-300';

    return (
        <Modal title="Your Profile" onClose={onClose}>
            <div className="space-y-6">
                <div>
                    <label className="text-sm font-semibold text-slate-400">Email Address</label>
                    <p className="text-lg text-slate-200 bg-gray-800 p-3 rounded-lg mt-1">{user.email}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <label className="text-sm font-semibold text-slate-400">Membership</label>
                        <p className={`text-2xl font-bold mt-1 ${membershipColor}`}>{membershipStatus}</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <label className="text-sm font-semibold text-slate-400">Available Credits</label>
                        {profile.is_pro ? (
                            <p className="text-2xl font-bold mt-1 text-green-400">Unlimited</p>
                        ) : (
                            <p className="text-2xl font-bold mt-1 text-yellow-400">{profile.credits}</p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 mt-4 border-t border-gray-700">
                    {!profile.is_pro && (
                        <Button onClick={onGoProClick} variant="primary" className="!bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 focus:!ring-yellow-400">
                            Upgrade to PRO
                        </Button>
                    )}
                    <Button onClick={onBuyCreditsClick} variant="secondary">
                        Get More Credits
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ProfileModal;
