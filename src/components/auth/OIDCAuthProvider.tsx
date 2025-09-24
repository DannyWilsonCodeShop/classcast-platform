'use client';

import React from 'react';
import { AuthProvider } from 'react-oidc-context';
import { cognitoAuthConfig } from '@/lib/oidc-config';

interface OIDCAuthProviderProps {
  children: React.ReactNode;
}

export function OIDCAuthProvider({ children }: OIDCAuthProviderProps) {
  return (
    <AuthProvider {...cognitoAuthConfig}>
      {children}
    </AuthProvider>
  );
}

