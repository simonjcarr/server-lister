'use client'
import { createContext, useContext } from 'react';

// Create a context to expose refetch functionality
export const ReportRefreshContext = createContext({
  refreshReport: () => {},
});

// Hook for using the report refresh context
export function useReportRefresh() {
  return useContext(ReportRefreshContext);
}
