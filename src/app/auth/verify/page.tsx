import { Suspense } from 'react';
import AuthContainer from '@/components/auth/AuthContainer';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContainer initialView="verify-email" />
    </Suspense>
  );
}

