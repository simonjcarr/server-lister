'use client';

import { Layout as AntdLayout } from 'antd';
import { ReactNode } from 'react';
import NavDrawerLeft from '../site/NavDrawerLeft';

type AppLayoutProps = {
  children: ReactNode;
  header: ReactNode;
};

export function AppLayout({ children, header }: AppLayoutProps) {
  return (
    <AntdLayout style={{ minHeight: '100vh' }}>
      {header}
      <AntdLayout.Content className="p-4">
        {children}
      </AntdLayout.Content>
    </AntdLayout>
  );
}
