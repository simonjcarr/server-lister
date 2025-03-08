'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './theme/ThemeProvider';
import { ReactNode } from 'react';
import { AntdCompatibilityProvider } from './lib/antdCompatible';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AntdCompatibilityProvider>
      <SessionProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </SessionProvider>
    </AntdCompatibilityProvider>
  );
}
