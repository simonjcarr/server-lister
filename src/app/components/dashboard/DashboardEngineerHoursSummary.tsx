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
    
    // For weekly data, show week starting date in short format
    const date = dayjs(value);
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
  const chartData = chartsData?.data || [];
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
                labelFormatter={(label) => `Week of ${formatXAxisTick(label)}`}
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