import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { IconButton } from './IconButton.jsx';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-lg', // 'max-w-md' | 'max-w-lg' | 'max-w-xl'
  className = ''
}) => {
  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop with paper-toned dimming */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#23252A]/40 backdrop-blur-sm"
          />

          {/* Modal Notebook Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`relative w-full ${maxWidth} bg-[#FFFDF9] border-2 border-[#23252A] shadow-paper-lg rounded-2xl overflow-hidden z-10 ${className}`}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#D5CFC3] flex items-center justify-between bg-[#FCFAF3]">
              <div>
                {title && (
                  <h3 className="text-xl font-handwriting font-bold tracking-wide text-[#23252A]">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-[#5C6069] mt-0.5 font-sans">
                    {subtitle}
                  </p>
                )}
              </div>
              <IconButton
                icon={X}
                variant="ghost"
                size="sm"
                onClick={onClose}
                title="Close modal"
              />
            </div>

            {/* Body */}
            <div className="px-6 py-5 max-h-[75vh] overflow-y-auto text-sm text-[#23252A] font-sans">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-3.5 border-t border-[#D5CFC3] bg-[#FCFAF3] flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
