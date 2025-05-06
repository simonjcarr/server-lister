'use client';

import React, { useState } from 'react';
import { Card, Spin, Empty, Radio, RadioChangeEvent, Select, Space, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getEngineerHoursChartData, getCumulativeEngineerHoursChartData } from '@/app/actions/server/engineerHours/reportActions';
import { useSession } from 'next-auth/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

type TimeRange = 'week' | 'month' | '6months' | 'year' | 'all';
type ChartType = 'individual' | 'cumulative';
type ChartStyle = 'line' | 'bar';

interface DataPoint {
  date: string;
  totalMinutes: number;
  totalHours: number;
  [key: string]: string | number; // For dynamic engineer names in individual charts
}

interface EngineerDataPoint extends DataPoint {
  engineerId: string;
  engineerName: string;
}

interface EngineerHoursChartProps {
  serverId: number;
}

const COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

const EngineerHoursChart: React.FC<EngineerHoursChartProps> = ({ serverId }) => {
  const { data: session } = useSession();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [chartType, setChartType] = useState<ChartType>('individual');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('line');
  const [showCurrentUserOnly, setShowCurrentUserOnly] = useState<boolean>(false);

  // Query for individual engineer data
  const individualQuery = useQuery({
    queryKey: ['engineerHoursChart', serverId, timeRange, showCurrentUserOnly, session?.user?.id],
    queryFn: () => getEngineerHoursChartData({
      serverId,
      timeRange,
      currentUserOnly: showCurrentUserOnly,
      userId: session?.user?.id
    }),
    enabled: chartType === 'individual',
  });

  // Query for cumulative data
  const cumulativeQuery = useQuery({
    queryKey: ['engineerHoursCumulativeChart', serverId, timeRange],
    queryFn: () => getCumulativeEngineerHoursChartData({
      serverId,
      timeRange,
    }),
    enabled: chartType === 'cumulative',
  });

  // Use the appropriate query based on chart type
  const { data: chartsData, isLoading, error } = 
    chartType === 'individual' ? individualQuery : cumulativeQuery;

  // Helper to format the X-axis labels based on time range
  const formatXAxisTick = (value: string) => {
    if (!value) return '';
    
    // Format based on time range
    if (timeRange === 'week' || timeRange === 'month') {
      // For daily data, show day/month (e.g., "05/15")
      const parts = value.split('-');
      return `${parts[1]}/${parts[2]}`;
    } else if (timeRange === '6months') {
      // For weekly data, show week number (e.g., "W23")
      const parts = value.split('-');
      return `W${parts[1]}`;
    } else {
      // For monthly data, show month/year (e.g., "05/2023")
      const parts = value.split('-');
      return `${parts[1]}/${parts[0].substring(2)}`;
    }
  };

  // Skip custom tooltip to fix TypeScript issues
  const renderTooltipContent = undefined;

  // Process data for the individual engineer chart
  const prepareIndividualChartData = () => {
    if (!chartsData?.success || !chartsData.data) return [];
    
    // Group by engineer to establish consistent colors
    const engineers = new Map();
    (chartsData.data as EngineerDataPoint[]).forEach(item => {
      if (!engineers.has(item.engineerId)) {
        engineers.set(item.engineerId, {
          id: item.engineerId,
          name: item.engineerName,
          color: COLORS[engineers.size % COLORS.length],
        });
      }
    });
    
    // Convert to format needed for the chart
    // We need one entry per date, with all engineers' hours for that date
    const chartDataByDate = new Map();
    
    (chartsData.data as EngineerDataPoint[]).forEach(item => {
      if (!chartDataByDate.has(item.date)) {
        chartDataByDate.set(item.date, { date: item.date });
      }
      
      const dateEntry = chartDataByDate.get(item.date);
      // Store hours by engineer name to ensure unique keys
      dateEntry[item.engineerName] = item.totalHours;
    });
    
    // Convert to array sorted by date
    return Array.from(chartDataByDate.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Handle time range changes
  const handleTimeRangeChange = (e: RadioChangeEvent) => {
    setTimeRange(e.target.value);
  };

  // Handle chart type changes
  const handleChartTypeChange = (value: ChartType) => {
    setChartType(value);
  };

  // Handle chart style changes
  const handleChartStyleChange = (value: ChartStyle) => {
    setChartStyle(value);
  };

  // Handle current user toggle
  const handleCurrentUserToggle = (value: boolean) => {
    setShowCurrentUserOnly(value);
  };

  // Prepare chart data based on chart type
  const chartData = chartType === 'individual' 
    ? prepareIndividualChartData() 
    : (chartsData?.success && chartsData.data ? chartsData.data : []);

  // Get unique engineers from the data for individual chart
  const engineers = new Map();
  if (chartType === 'individual' && chartsData?.success && chartsData.data) {
    (chartsData.data as EngineerDataPoint[]).forEach(item => {
      if (!engineers.has(item.engineerId)) {
        engineers.set(item.engineerId, {
          id: item.engineerId,
          name: item.engineerName,
          color: COLORS[engineers.size % COLORS.length],
        });
      }
    });
  }

  // Get chart title based on selections
  const getChartTitle = () => {
    let title = "Engineer Hours";
    
    // Add time range
    switch (timeRange) {
      case 'week': title += " (Last Week)"; break;
      case 'month': title += " (Last Month)"; break;
      case '6months': title += " (Last 6 Months)"; break;
      case 'year': title += " (Last Year)"; break;
      case 'all': title += " (All Time)"; break;
    }
    
    // Add user filter if applicable
    if (chartType === 'individual' && showCurrentUserOnly && session?.user) {
      title += ` - ${session.user.name || 'Your'} Hours Only`;
    }
    
    return title;
  };

  return (
    <Card
      title={getChartTitle()}
      className="w-full mb-6"
      styles={{ body: { padding: '12px' } }}
      extra={
        <Space>
          {/* View selector */}
          <Select
            value={chartType}
            onChange={handleChartTypeChange}
            options={[
              { value: 'individual', label: 'Individual' },
              { value: 'cumulative', label: 'Cumulative' },
            ]}
            style={{ width: 120 }}
          />

          {/* Chart style selector */}
          <Select
            value={chartStyle}
            onChange={handleChartStyleChange}
            options={[
              { value: 'line', label: 'Line Chart' },
              { value: 'bar', label: 'Bar Chart' },
            ]}
            style={{ width: 110 }}
          />

          {/* Current user filter - only show for individual charts */}
          {chartType === 'individual' && session?.user && (
            <Select
              value={showCurrentUserOnly}
              onChange={handleCurrentUserToggle}
              options={[
                { value: false, label: 'All Engineers' },
                { value: true, label: 'Just Me' },
              ]}
              style={{ width: 120 }}
            />
          )}
        </Space>
      }
    >
      {/* Time range selector */}
      <div className="mb-4 flex justify-center">
        <Radio.Group
          value={timeRange}
          onChange={handleTimeRangeChange}
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="week">Week</Radio.Button>
          <Radio.Button value="month">Month</Radio.Button>
          <Radio.Button value="6months">6 Months</Radio.Button>
          <Radio.Button value="year">Year</Radio.Button>
          <Radio.Button value="all">All Time</Radio.Button>
        </Radio.Group>
      </div>

      {/* Chart container */}
      <div className="h-72">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Spin spinning={true}>
              <div className="h-full w-full flex items-center justify-center text-gray-500">
                Loading chart data...
              </div>
            </Spin>
          </div>
        ) : error || !chartsData?.success ? (
          <div className="h-full flex items-center justify-center">
            <Alert 
              type="error" 
              message="Error loading data" 
              description={chartsData && !chartsData.success && 'error' in chartsData 
                ? chartsData.error 
                : "Failed to load engineer hours data"} 
            />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Empty description="No engineer hours data available for this time period" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartStyle === 'line' ? (
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={formatXAxisTick}
                />
                <YAxis 
                  label={{ 
                    value: 'Hours', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <RechartsTooltip content={renderTooltipContent} />
                <Legend />
                
                {chartType === 'individual' ? (
                  // Render a line for each engineer
                  Array.from(engineers.values()).map((engineer) => (
                    <Line
                      key={engineer.id}
                      type="monotone"
                      dataKey={engineer.name}
                      name={engineer.name}
                      stroke={engineer.color}
                      activeDot={{ r: 8 }}
                      connectNulls
                    />
                  ))
                ) : (
                  // Render a single line for cumulative data
                  <Line
                    type="monotone"
                    dataKey="totalHours"
                    name="Total Hours"
                    stroke="#0088FE"
                    activeDot={{ r: 8 }}
                  />
                )}
              </LineChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={formatXAxisTick}
                />
                <YAxis 
                  label={{ 
                    value: 'Hours', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <RechartsTooltip content={renderTooltipContent} />
                <Legend />
                
                {chartType === 'individual' ? (
                  // Render a bar for each engineer
                  Array.from(engineers.values()).map((engineer) => (
                    <Bar
                      key={engineer.id}
                      dataKey={engineer.name}
                      name={engineer.name}
                      fill={engineer.color}
                    />
                  ))
                ) : (
                  // Render a single bar for cumulative data
                  <Bar
                    dataKey="totalHours"
                    name="Total Hours"
                    fill="#0088FE"
                  />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default EngineerHoursChart;