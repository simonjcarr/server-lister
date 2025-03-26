'use client'
import { Card } from 'antd';
import React, { createContext, useContext } from 'react'
import ReportDrawer from '../components/reports/ReportDrawer';
import { MenuOutlined, ReloadOutlined } from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

// Create a context to expose refetch functionality
export const ReportRefreshContext = createContext({
  refreshReport: () => {},
});

export function useReportRefresh() {
  return useContext(ReportRefreshContext);
}


export default function ReportLayout({
  children,
  showRefresh = true,
}: Readonly<{
  children: React.ReactNode;
  showRefresh?: boolean;
}>) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  
  // Get the last segment of the URL path
  const getReportId = () => {
    if (!pathname) return null;
    const segments = pathname.split('/');
    return segments[segments.length - 1];
  };
  
  const refreshReport = () => {
    const reportId = getReportId();
    if (reportId) {
      // Invalidate the specific query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['report', reportId] });
    }
  };
  
  const contextValue = {
    refreshReport,
  };
  
  return (
    <ReportRefreshContext.Provider value={contextValue}>
      <Card 
        title={
          <div className='flex justify-between items-center'>
            <span className='flex gap-2 cursor-pointer'>
              <ReportDrawer><MenuOutlined /></ReportDrawer> Reports
            </span>
            {showRefresh && (
              <span className='cursor-pointer' onClick={refreshReport}>
                <ReloadOutlined />
              </span>
            )}
          </div>
        } 
        size="small" 
        className="w-full">
        {children}
      </Card>
    </ReportRefreshContext.Provider>
  );
}