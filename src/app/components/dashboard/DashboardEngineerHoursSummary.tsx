'use client';

import React from 'react';
import { Card, Spin, Empty, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getDashboardEngineerHoursChartData } from '@/app/actions/server/engineerHours/dashboardActions';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with necessary timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Types for the component props
interface DashboardEngineerHoursSummaryProps {
  title?: string;
}

const DashboardEngineerHoursSummary: React.FC<DashboardEngineerHoursSummaryProps> = ({ 
  title = "Engineer Hours Summary"
}) => {
  // Query for the chart data
  const { data: chartsData, isLoading, error } = useQuery({
    queryKey: ['dashboardEngineerHoursSummary'],
    queryFn: () => getDashboardEngineerHoursChartData({ 
      timeRange: 'month', 
      chartType: 'cumulative' 
    }),
  });
    
  // Helper to format the X-axis labels
  const formatXAxisTick = (value: string) => {
    if (!value) return '';
    
    // CRITICAL FIX: Always format dates in UTC to prevent timezone shifts
    // This ensures dates like April 13 don't get shifted to April 12
    const rawDate = value;
    
    // First extract just the date portion without time
    let dateStr = rawDate;
    if (rawDate.includes('T')) {
      dateStr = rawDate.split('T')[0];
    }
    
    // Create a date in UTC to avoid timezone shifts
    const date = dayjs.utc(dateStr);
    
    // Extra debug for April 13
    if (dateStr === '2025-04-13' || dateStr.includes('2025-04-13')) {
      console.log('[FIXED Chart] April 13 detection in X-axis formatter:', {
        rawValue: value,
        extractedDate: dateStr,
        formatResult: date.format('MMM DD')
      });
    }
    
    return date.format('MMM DD');
  };

  // Render function for loading state
  if (isLoading) {
    return (
      <Card title={title} size="small" className="mb-4">
        <div className="flex justify-center items-center py-4">
          <Spin spinning={true} size="small">
            <div className="h-12 flex items-center justify-center text-xs text-gray-500">
              Loading data...
            </div>
          </Spin>
        </div>
      </Card>
    );
  }
  
  // Render function for error state
  if (error || !chartsData?.success) {
    return (
      <Card title={title} size="small" className="mb-4">
        <Alert
          type="error"
          message="Error loading chart data"
          description={chartsData && !chartsData.success && 'error' in chartsData 
            ? chartsData.error 
            : "Failed to load engineer hours data"} 
        />
      </Card>
    );
  }
  
  // Check if we have data
  const rawChartData = chartsData?.data || [];
  
  // CRITICAL FIX: Pre-process the data to ensure correct date handling
  const chartData = rawChartData.map(item => {
    // Create a new object to avoid mutating the original
    const processedItem = {...item};
    
    // If the date is a full timestamp, extract just the date part
    if (typeof processedItem.date === 'string' && processedItem.date.includes('T')) {
      processedItem.date = processedItem.date.split('T')[0];
    }
    
    // Special handling for April 13 data to debug
    if (processedItem.date === '2025-04-13') {
      console.log('[FIXED] Processing April 13 data point:', {
        original: item.date,
        processed: processedItem.date,
        hours: processedItem.totalHours
      });
    }
    
    return processedItem;
  });
  
  const hasData = chartData.length > 0;
  
  // Calculate total hours
  const totalHours = chartData.reduce((sum, item) => sum + (item.totalHours || 0), 0);
  
  return (
    <Card
      title={title}
      className="w-full mb-6"
      size="small"
      extra={
        <div className="text-sm font-medium">
          Total: {totalHours.toFixed(1)} hours
        </div>
      }
    >
      {/* Chart container */}
      <div className="h-44">
        {!hasData ? (
          <div className="h-full flex items-center justify-center">
            <Empty description="No engineer hours data available" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tickFormatter={formatXAxisTick}
                minTickGap={25}
              />
              <YAxis 
                allowDecimals={false}
                domain={[0, 'auto']}
              />
              <RechartsTooltip 
                formatter={(value: number) => [`${value.toFixed(1)} hours`, 'Total Hours']}
                labelFormatter={(label) => {
                  // CRITICAL FIX: Ensure the label shows the correct date without timezone shift
                  let dateLabel = label;
                  
                  // If it has a time component, extract just the date
                  if (typeof label === 'string' && label.includes('T')) {
                    dateLabel = label.split('T')[0];
                  }
                  
                  // Format using UTC to ensure no date shifting
                  const formattedDate = dayjs.utc(dateLabel).format('YYYY-MM-DD');
                  
                  // Special handling for April 13
                  if (dateLabel === '2025-04-13' || dateLabel.includes('2025-04-13')) {
                    console.log('[FIXED Tooltip] April 13 in tooltip:', {
                      originalLabel: label,
                      processedLabel: dateLabel,
                      formattedDate
                    });
                  }
                  
                  return `Date: ${formattedDate}`;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalHours"
                name="Total Hours"
                stroke="#0088FE"
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default DashboardEngineerHoursSummary;