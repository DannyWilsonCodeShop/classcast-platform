import { Suspense } from 'react';
import AuthContainer from '@/components/auth/AuthContainer';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContainer initialView="reset-password" />
    </Suspense>
  );
}

