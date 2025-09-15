import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface TermsModalProps {
  onAgree: () => void;
  onCancel: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onAgree, onCancel }) => {
  const terms = [
    "You are 18+ and will not upload images of minors.",
    "You own the image or have explicit permission to use it.",
    "No illegal, abusive, or non-consensual content.",
    "Edits are for fun/visualization; AI may be inaccurate.",
    "We are not liable for misuse or third-party claims.",
  ];

  return (
    <Modal title="Terms & Use Confirmation" onClose={onCancel}>
      <div className="text-slate-300">
        <ul className="space-y-3 list-disc list-inside mb-8">
          {terms.map((term, index) => (
            <li key={index}>{term}</li>
          ))}
        </ul>
        <div className="flex justify-end items-center gap-4">
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button onClick={onAgree} variant="primary">
            I Agree
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TermsModal;