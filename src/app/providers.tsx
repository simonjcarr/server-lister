'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './theme/ThemeProvider';
import { ReactNode } from 'react';
import { AntdCompatibilityProvider } from './lib/antdCompatible';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
    <AntdCompatibilityProvider>
      <SessionProvider>
        <ThemeProvider>
          
            {children}
          
        </ThemeProvider>
      </SessionProvider>
    </AntdCompatibilityProvider>
    </QueryClientProvider>
  );
}
