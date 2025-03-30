'use client';

import { Layout as AntdLayout } from 'antd';
import { ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type AppLayoutProps = {
  children: ReactNode;
  header: ReactNode;
};

export function AppLayout({ children, header }: AppLayoutProps) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If the user is not authenticated and the session status is known (not 'loading'),
    // redirect to the sign-in page
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  // While checking authentication status, optionally show a loading state
  if (status === 'loading') {
    return (
      <AntdLayout style={{ minHeight: '100vh' }}>
        <div className='container mx-auto text-center py-12'>
          <div className='animate-pulse'>Loading authentication...</div>
        </div>
      </AntdLayout>
    );
  }

  // If user is not authenticated, don't render the content (the useEffect will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  // User is authenticated, render the actual content
  return (
    <AntdLayout style={{ minHeight: '100vh' }}>
      <div className='container mx-auto'>
        {header}
        <AntdLayout.Content className="">
          {children}
        </AntdLayout.Content>
      </div>
    </AntdLayout>
  );
}
