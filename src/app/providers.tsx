'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './theme/ThemeProvider';
import { ReactNode } from 'react';
import { AntdCompatibilityProvider } from './lib/antdCompatible';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationProvider from './components/notifications/NotificationProvider';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AntdCompatibilityProvider>
        <SessionProvider>
          <ThemeProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </ThemeProvider>
        </SessionProvider>
      </AntdCompatibilityProvider>
    </QueryClientProvider>
  );
}
