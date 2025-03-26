import { Card } from 'antd';
import React from 'react'
import ReportDrawer from '../components/reports/ReportDrawer';
import { MenuOutlined } from '@ant-design/icons';

export default function ReportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Card 
      title={(<span className='flex gap-2 cursor-pointer'><ReportDrawer><MenuOutlined /></ReportDrawer> Reports</span>)} 
    size="small" 
    className="w-full">
    {children}
      </Card>
  );
}