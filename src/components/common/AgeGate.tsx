'use client';

import React, { useState, useEffect } from 'react';

const AGE_GATE_KEY = 'classcast-age-verified';

/**
 * Age Gate Component
 * 
 * Shows an age verification screen on first app launch.
 * Satisfies Apple guideline 1.3.0 (Kids Category) by:
 * - Declaring the app is for ages 14+ (high school education)
 * - Requiring age confirmation before proceeding
 * - Not collecting DOB, just a simple confirmation
 * 
 * Once confirmed, the gate is not shown again.
 */
export function AgeGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [showDeclined, setShowDeclined] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(AGE_GATE_KEY);
    setVerified(stored === 'true');
  }, []);

  const handleConfirm = () => {
    localStorage.setItem(AGE_GATE_KEY, 'true');
    setVerified(true);
  };

  const handleDecline = () => {
    setShowDeclined(true);
  };

  // Loading state
  if (verified === null) return null;

  // Already verified
  if (verified) return <>{children}</>;

  // Declined
  if (showDeclined) {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-8 bg-white">
        <img src="/UpdatedCCLogo.png" alt="ClassCast" className="w-20 h-20 mb-6" />
        <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">
          Age Requirement Not Met
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          ClassCast.ai is designed for students ages 14 and older. 
          If you believe this is an error, please contact your school administrator.
        </p>
        <button
          onClick={() => setShowDeclined(false)}
          className="px-6 py-2.5 text-sm font-medium text-[#005587] border border-[#005587] rounded-full"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Age gate screen
  return (
    <div className="h-screen flex flex-col items-center justify-center px-8 bg-gradient-to-b from-white to-[#f0f9fc]">
      <img src="/UpdatedCCLogo.png" alt="ClassCast" className="w-24 h-24 mb-6" />
      <h1 className="text-2xl font-bold text-[#005587] mb-2 text-center" style={{ fontFamily: "'Oswald', sans-serif" }}>
        Welcome to ClassCast
      </h1>
      <p className="text-sm text-gray-600 text-center mb-8 max-w-[280px]">
        This app is designed for high school and college students ages 14 and older 
        as part of their educational coursework.
      </p>

      <div className="w-full max-w-[300px] space-y-3">
        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-[#005587] text-white font-semibold rounded-full text-sm shadow-lg active:scale-[0.97] transition-transform"
        >
          I am 14 years or older
        </button>
        <button
          onClick={handleDecline}
          className="w-full py-3 bg-gray-100 text-gray-600 font-medium rounded-full text-sm active:scale-[0.97] transition-transform"
        >
          I am under 14
        </button>
      </div>

      <p className="text-[10px] text-gray-400 mt-8 text-center max-w-[260px]">
        By continuing, you confirm that you meet the age requirement and agree to 
        our <a href="/privacy" className="underline">Privacy Policy</a>.
      </p>
    </div>
  );
}

/**
 * Check if age has been verified (for use in other components)
 */
export function isAgeVerified(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AGE_GATE_KEY) === 'true';
}

/**
 * Reset age verification (for testing)
 */
export function resetAgeGate(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AGE_GATE_KEY);
}
