import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, Shield, Calendar } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { getColorFamily } from '../../config/colors.js';

export const ProfileReviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  profile
}) => {
  if (!profile) return null;

  const color = getColorFamily(profile.primaryColor);
  const formattedDate = new Date(profile.updatedAt || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Player Profile"
      subtitle="Verify your warrior identity before entering battle sectors"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Edit Information
          </Button>
          <Button
            variant="primary"
            icon={ArrowRight}
            iconPosition="right"
            onClick={onConfirm}
          >
            Confirm & Enter Lobby
          </Button>
        </>
      }
    >
      <div className="space-y-4 font-sans text-sm">
        {/* Profile Details Sheet */}
        <div className="p-4 rounded-xl bg-[#FCFAF3] border border-[#23252A] shadow-sketch-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#D5CFC3]">
            <span className="text-xs font-mono uppercase text-[#5C6069]">Call-Sign</span>
            <span className="text-lg font-handwriting font-bold text-[#23252A]">
              {profile.nickname}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#D5CFC3]">
            <span className="text-xs font-mono uppercase text-[#5C6069]">Primary Color Family</span>
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/20"
                style={{ backgroundColor: color.hex }}
              />
              <span className="font-semibold text-xs text-[#23252A]">
                {color.name.toUpperCase()} ({color.label})
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-[#D5CFC3]">
            <span className="text-xs font-mono uppercase text-[#5C6069]">Persistence State</span>
            <span className="inline-flex items-center gap-1 text-xs font-mono text-[#D59926] bg-[#FCF8EE] px-2 py-0.5 rounded border border-[#D59926]/40">
              LOCAL DRAFT (DEV PREVIEW)
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-[#5C6069] pt-1">
            <span className="flex items-center gap-1 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>Draft Timestamp</span>
            </span>
            <span className="font-mono">{formattedDate}</span>
          </div>
        </div>

        {/* Clear Notice regarding Postponed OAuth Integration */}
        <div className="p-3.5 rounded-lg bg-[#EFE8DA]/60 border border-[#D5CFC3] text-xs text-[#5C6069] space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-[#23252A]">
            <AlertCircle className="w-4 h-4 text-[#2B68B4]" />
            <span>OAuth Integration Status</span>
          </div>
          <p className="leading-relaxed">
            Google OAuth has intentionally been postponed until the final integration stage. 
            This profile is preserved in your browser's local state. Permanent cloud synchronization will connect when Google authentication is linked in Task 05+.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileReviewModal;
