import { Suspense } from 'react';
import AuthContainer from '@/components/auth/AuthContainer';

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContainer initialView="signup" />
    </Suspense>
  );
}

