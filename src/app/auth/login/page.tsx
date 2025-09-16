import { Suspense } from 'react';
import AuthContainer from '@/components/auth/AuthContainer';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContainer initialView="login" />
    </Suspense>
  );
}

