'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GradingPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/instructor/grading/bulk');
  }, [router]);

  // Return empty — layout header already shows "Grading"
  return null;
}
