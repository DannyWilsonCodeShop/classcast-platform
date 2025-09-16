import { Suspense } from 'react';
import AuthContainer from '@/components/auth/AuthContainer';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContainer initialView="forgot-password" />
    </Suspense>
  );
}

