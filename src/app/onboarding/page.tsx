'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const slides = [
  {
    emoji: '🎬',
    title: 'Welcome to ClassCast',
    subtitle: 'Show what you know through video',
  },
  {
    emoji: '📹',
    title: 'Record & Submit',
    subtitle: 'Video responses right from your phone',
  },
  {
    emoji: '👥',
    title: 'Learn from Peers',
    subtitle: 'Watch, rate, and grow together',
  },
  {
    emoji: '📊',
    title: 'Track Progress',
    subtitle: 'Grades, feedback, all in one place',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('classcast_onboarded')) {
      router.replace('/auth/login');
    }
  }, []);

  const goNext = () => {
    if (animating) return;
    if (current < slides.length - 1) {
      setAnimating(true);
      setTimeout(() => { setCurrent(c => c + 1); setAnimating(false); }, 200);
    } else {
      localStorage.setItem('classcast_onboarded', 'true');
      router.push('/auth/login');
    }
  };

  const skip = () => {
    localStorage.setItem('classcast_onboarded', 'true');
    router.push('/auth/login');
  };

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  return (
    <div className="fixed inset-0 bg-[#005587] flex flex-col overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/3 -left-16 w-48 h-48 bg-[#FFC72C]/10 rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute -bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full animate-pulse" style={{ animationDuration: '5s' }} />
      </div>

      {/* Skip */}
      {!isLast && (
        <div className="relative z-10 flex justify-end px-5 pt-12">
          <button onClick={skip} className="text-white/50 text-xs font-medium px-3 py-1 rounded-full border border-white/20">Skip</button>
        </div>
      )}
      {isLast && <div className="pt-12" />}

      {/* Content - centered, compact */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
        {/* Logo */}
        <img
          src="/UpdatedCCLogo.png"
          alt="ClassCast"
          className="w-12 h-12 object-contain mb-4 opacity-80"
        />

        {/* Emoji with bounce animation */}
        <div
          key={current}
          className="text-5xl mb-4 animate-bounce"
          style={{ animationDuration: '2s', animationIterationCount: 'infinite' }}
        >
          {slide.emoji}
        </div>

        {/* Title with fade */}
        <h1
          key={`t-${current}`}
          className={`text-white text-xl font-bold text-center mb-2 transition-all duration-300 ${animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
        >
          {slide.title}
        </h1>

        {/* Subtitle */}
        <p
          key={`s-${current}`}
          className={`text-white/60 text-sm text-center transition-all duration-300 delay-75 ${animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
        >
          {slide.subtitle}
        </p>
      </div>

      {/* Bottom area - dots + button */}
      <div className="relative z-10 px-8 pb-10">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-5">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-5 h-1.5 bg-[#FFC72C]' : 'w-1.5 h-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Button */}
        <button
          onClick={goNext}
          className="w-full py-3 bg-[#FFC72C] text-[#005587] rounded-full font-bold text-sm shadow-lg active:scale-95 transition-transform"
        >
          {isLast ? 'Get Started →' : 'Next'}
        </button>
      </div>
    </div>
  );
}
