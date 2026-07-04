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
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-black/40 ${isOpen ? 'animate-backdrop-enter' : 'animate-backdrop-exit'}`}
        onClick={onClose}
      />
      <div className={`relative ${animClass}`}>{children}</div>
    </div>
  );
}
