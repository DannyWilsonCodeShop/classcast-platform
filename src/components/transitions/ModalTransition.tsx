'use client';

import { useState, useEffect } from 'react';

interface ModalTransitionProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ModalTransition({ isOpen, onClose, children }: ModalTransitionProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => setAnimClass('animate-modal-enter'));
    } else {
      setAnimClass('animate-modal-exit');
      const timeout = setTimeout(() => setShouldRender(false), 280);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pb-20 sm:pb-0" data-modal-open>
      <div
        className={`absolute inset-0 bg-black/40 ${isOpen ? 'animate-backdrop-enter' : 'animate-backdrop-exit'}`}
        onClick={onClose}
      />
      <div className={`relative z-10 w-full max-w-[380px] mx-4 ${animClass}`}>
        {children}
      </div>
    </div>
  );
}
