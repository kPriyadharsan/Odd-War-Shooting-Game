import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Shield
} from 'lucide-react';
import { DrawingCanvas } from './DrawingCanvas.jsx';
import { Modal, Button } from '../ui/index.js';
import { soundEffects } from '../../services/soundEffects.js';

const STAGE_CONFIG = {
  HEAD: {
    title: 'DRAW YOUR HEAD',
    description: 'Sketch your warrior’s head, face, or helmet using freehand pencil strokes.',
    next: 'BODY'
  },
  BODY: {
    title: 'DRAW YOUR BODY',
    description: 'Sketch your warrior’s torso, arms, and legs below the head.',
    next: 'GUN'
  },
  GUN: {
    title: 'DRAW YOUR GUN',
    description: 'Sketch your paper weapon or blaster attached to your warrior.',
    next: 'BULLET'
  },
  BULLET: {
    title: 'DRAW YOUR BULLET',
    description: 'Sketch your pencil ammunition into the magazine chamber.',
    next: 'ARMED'
  }
};

/**
 * CharacterDrawingModal Component (Task 09)
 * Full modal providing the manual drawing experience for an eligible row station.
 */
export const CharacterDrawingModal = ({
  isOpen = false,
  onClose = () => {},
  rowNumber = 1,
  stage = 'HEAD',
  previousDrawings = null,
  playerShadeHex = '#2B68B4',
  onSubmit = () => {},
  isSubmitting = false,
  error = null
}) => {
  const [pendingStrokes, setPendingStrokes] = useState(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const stageMeta = STAGE_CONFIG[stage] || STAGE_CONFIG.HEAD;
  const stages = ['HEAD', 'BODY', 'GUN', 'BULLET'];

  const handleCanvasSave = ({ strokes }) => {
    soundEffects.playButtonClick();
    setPendingStrokes(strokes);
    setShowConfirmSubmit(true);
  };

  const handleConfirmSubmit = () => {
    if (!pendingStrokes) return;
    soundEffects.playStageComplete();
    onSubmit({
      rowNumber,
      stage,
      strokeData: { strokes: pendingStrokes }
    });
    setShowConfirmSubmit(false);
  };

  const handleClose = () => {
    soundEffects.playButtonClick();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        className="relative w-full max-w-xl my-auto rounded-2xl border-2 border-[#23252A] bg-[#FCFAF5] shadow-2xl p-4 sm:p-6 overflow-hidden select-none"
      >
        {/* Notebook Top Paper Ruling Accent */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_23px,rgba(130,155,185,0.3)_24px)]" />

        {/* Header: Title, Row Badge & Close */}
        <div className="relative z-10 flex items-center justify-between pb-3 mb-3 border-b border-[#D5CFC3]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded bg-[#242730] text-[#F8F4EB] font-mono font-bold text-xs tracking-wide">
                ROW {rowNumber}
              </span>
              <span className="text-[11px] font-mono uppercase text-[#D59926] font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> STAGE {stage}
              </span>
            </div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-[#23252A]">
              {stageMeta.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg border border-[#D5CFC3] text-[#4A4F5B] hover:text-[#23252A] hover:bg-[#EFE8DA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Construction Sequence Indicator */}
        <div className="relative z-10 flex items-center justify-between gap-1 mb-3 p-2 rounded-lg bg-[#FAF5EB] border border-[#D5CFC3] text-[10px] sm:text-xs font-mono">
          {stages.map((stg, idx) => {
            const isCompleted = previousDrawings && previousDrawings[stg];
            const isCurrent = stg === stage;

            return (
              <React.Fragment key={stg}>
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                    isCurrent
                      ? 'bg-[#242730] text-[#F8F4EB] font-bold shadow-xs'
                      : isCompleted
                      ? 'text-[#2E8557] font-semibold bg-[#2E8557]/10'
                      : 'text-[#8C929D]'
                  }`}
                >
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-[#2E8557]" />}
                  <span>{stg}</span>
                </div>
                {idx < stages.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-[#D5CFC3] shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Stage Description Notice */}
        <p className="relative z-10 font-handwriting text-xs sm:text-sm text-[#4A4F5B] mb-3">
          {stageMeta.description}
        </p>

        {/* Error Notification */}
        {error && (
          <div className="relative z-10 mb-3 p-2.5 rounded-lg border border-[#CE4242]/40 bg-[#FDF2F2] text-[#CE4242] text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Interactive Drawing Canvas */}
        <div className="relative z-10">
          <DrawingCanvas
            stage={stage}
            previousDrawings={previousDrawings}
            playerShadeHex={playerShadeHex}
            onSave={handleCanvasSave}
          />
        </div>

        {/* Confirmation Modal Overlay before saving */}
        {showConfirmSubmit && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm rounded-xl border-2 border-[#23252A] bg-[#FCFAF5] p-5 shadow-2xl text-center"
            >
              <div className="w-10 h-10 rounded-full bg-[#2E8557]/15 text-[#2E8557] flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#23252A] mb-1">
                Submit {stage}?
              </h3>
              <p className="font-mono text-xs text-[#5C6069] mb-4">
                This pencil drawing will be permanently saved to <strong>Row {rowNumber}</strong> and visible to all warriors.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfirmSubmit(false)}
                >
                  Edit Drawing
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleConfirmSubmit}
                  className="bg-[#2E8557] hover:bg-[#1C5236] text-white"
                >
                  {isSubmitting ? 'Saving...' : `Confirm & Save ${stage}`}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
