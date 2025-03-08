'use client';

import { Layout as AntdLayout } from 'antd';
import { ReactNode } from 'react';
import NavDrawerLeft from '../site/navDrawer/NavDrawerLeft';

type AppLayoutProps = {
  children: ReactNode;
  header: ReactNode;
};

export function AppLayout({ children, header }: AppLayoutProps) {
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
