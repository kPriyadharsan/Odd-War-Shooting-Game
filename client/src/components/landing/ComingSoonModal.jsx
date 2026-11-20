import React from 'react';
import { Pencil, CheckCircle2, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';

export const ComingSoonModal = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Opening Exercise Book..."
      subtitle="ODD WAR Development Roadmap"
      footer={
        <Button variant="primary" onClick={onClose}>
          Got it, Commander
        </Button>
      }
    >
      <div className="space-y-4 font-sans text-sm">
        <div className="p-4 rounded-xl bg-[#FCFAF3] border border-[#D5CFC3] flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#23252A] text-[#FFFDF9] flex items-center justify-center shrink-0">
            <Pencil className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-handwriting font-bold text-lg text-[#23252A]">
              Task 04 Scheduled: Multiplayer Rooms & Matchmaking
            </h4>
            <p className="text-xs text-[#5C6069] mt-1 leading-relaxed">
              You are currently experiencing the Task 03 Landing Page & Notebook Design System. 
              Live Google Sign-In, 2–4 player private room lobbies, and real-time Socket.IO game sessions are architected and will launch in Task 04!
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="font-semibold text-[#23252A] uppercase tracking-wider font-mono">
            Foundation Status:
          </div>
          <div className="flex items-center gap-2 text-[#2E8557]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Task 01: Express & Socket.IO 30Hz Architecture Initialized</span>
          </div>
          <div className="flex items-center gap-2 text-[#2E8557]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Task 02: Notebook Design System & 2D Animation Foundation Verified</span>
          </div>
          <div className="flex items-center gap-2 text-[#2B68B4]">
            <ArrowRight className="w-4 h-4" />
            <span>Task 03: Landing Page & Nostalgic Notebook Experience Complete</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ComingSoonModal;
