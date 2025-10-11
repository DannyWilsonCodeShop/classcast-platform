'use client';

import React from 'react';
import '@/styles/cristo-rey.css';

export default function CristoReyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="cristo-rey-dashboard">
      {children}
    </div>
  );
}
