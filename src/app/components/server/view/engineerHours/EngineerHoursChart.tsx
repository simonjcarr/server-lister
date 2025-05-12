'use client';

import React, { useState } from 'react';
import { Card, Spin, Empty, Radio, RadioChangeEvent, Select, Space, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getEngineerHoursChartData, getCumulativeEngineerHoursChartData } from '@/app/actions/server/engineerHours/reportActions';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with necessary plugins to handle timezone correctly
dayjs.extend(utc);
dayjs.extend(timezone);
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
    
  // Extract time range boundaries for chart display
  const timeRangeBoundaries = chartsData?.success ? chartsData.timeRangeBoundaries : null;

  // Helper to format the X-axis labels based on time range
  const formatXAxisTick = (value: string) => {
    if (!value) return '';
    
    // CRITICAL FIX: Use UTC for date formatting to ensure consistency
    // Parse the date with UTC to avoid timezone shifts
    const date = dayjs.utc(value);
    
    // Special handling to debug April 13 dates
    if (value === '2025-04-13') {
      console.log('[Chart] Formatting X-axis tick for April 13:', {
        originalValue: value,
        formattedValue: date.format('MM/DD')
      });
    }
    
    // Format based on time range
    if (timeRange === 'week' || timeRange === 'month') {
      // For daily data, show day/month (e.g., "05/15")
      return date.format('MM/DD');
    } else if (timeRange === '6months') {
      // For weekly data, show week number (e.g., "W15")
      return `W${date.isoWeek()}`;
    } else {
      // For monthly data, show month/year (e.g., "05/23")
      return date.format('MM/YY');
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
    
    // If we have time range boundaries, generate empty data points for the full range
    if (timeRangeBoundaries && timeRange !== 'all') {
      const { startDate, endDate, intervalType } = timeRangeBoundaries;
      
      let current = dayjs(startDate);
      const end = dayjs(endDate);
      
      // Generate data points for the entire requested range
      while (current.isBefore(end) || current.isSame(end, 'day')) {
        let dateKey: string;
        
        if (intervalType === 'day') {
          dateKey = current.format('YYYY-MM-DD');
          current = current.add(1, 'day');
        } else if (intervalType === 'week') {
          // For week intervals, use the start of the week as the key
          dateKey = current.startOf('week').format('YYYY-MM-DD');
          current = current.add(1, 'week');
        } else {
          // For month intervals
          dateKey = current.format('YYYY-MM');
          current = current.add(1, 'month');
        }
        
        if (!chartDataByDate.has(dateKey)) {
          chartDataByDate.set(dateKey, { date: dateKey });
        }
      }
    }
    
    // Now populate with actual data - ensure consistent date handling
    (chartsData.data as EngineerDataPoint[]).forEach(item => {
      // Normalize date format to prevent timezone issues
      let normalizedDate = item.date;
      
      // If it's a timestamp string, extract just the date part
      if (typeof item.date === 'string' && item.date.includes('T')) {
        normalizedDate = item.date.split('T')[0];
      }
      
      // Debug logging for April 13 data
      if (normalizedDate === '2025-04-13' || (typeof item.date === 'string' && item.date.includes('2025-04-13'))) {
        console.log(`[FIXED Individual Chart] Processing April 13 data point:`, {
          originalDate: item.date,
          normalizedDate,
          engineer: item.engineerName,
          hours: item.totalHours
        });
      }
      
      // Use the normalized date for the map key
      if (!chartDataByDate.has(normalizedDate)) {
        chartDataByDate.set(normalizedDate, { date: normalizedDate });
      }
      
      const dateEntry = chartDataByDate.get(normalizedDate);
      // Store hours by engineer name to ensure unique keys
      dateEntry[item.engineerName] = item.totalHours;
    });
    
    // Make sure all engineers have entries for all dates (with 0 if no data)
    const engineerNames = Array.from(engineers.values()).map(e => e.name);
    chartDataByDate.forEach(entry => {
      engineerNames.forEach(name => {
        if (entry[name] === undefined) {
          entry[name] = 0;
        }
      });
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

  // Process data for cumulative chart
  const prepareCumulativeChartData = () => {
    if (!chartsData?.success || !chartsData.data) return [];
    
    const cumulativeData = new Map();
    
    // If we have time range boundaries, generate empty data points for the full range
    if (timeRangeBoundaries && timeRange !== 'all') {
      const { startDate, endDate, intervalType } = timeRangeBoundaries;
      
      // CRITICAL FIX: Ensure consistent date handling with UTC
      let current = dayjs.utc(startDate);
      const end = dayjs.utc(endDate);
      
      // Generate data points for the entire requested range
      while (current.isBefore(end) || current.isSame(end, 'day')) {
        let dateKey: string;
        
        if (intervalType === 'day') {
          dateKey = current.format('YYYY-MM-DD');
          current = current.add(1, 'day');
        } else if (intervalType === 'week') {
          // For week intervals, use the start of the week as the key
          // Ensure we're using ISO weeks consistently
          dateKey = current.startOf('isoWeek').format('YYYY-MM-DD');
          current = current.add(1, 'week');
        } else {
          // For month intervals
          dateKey = current.format('YYYY-MM');
          current = current.add(1, 'month');
        }
        
        if (!cumulativeData.has(dateKey)) {
          cumulativeData.set(dateKey, { 
            date: dateKey,
            totalHours: 0,
            totalMinutes: 0 
          });
        }
      }
    }
    
    // Process and normalize the actual data for consistent date handling
    chartsData.data.forEach(item => {
      // Normalize the date format to ensure consistency
      let normalizedDate = item.date;
      
      // If it's a timestamp string, extract just the date part
      if (typeof item.date === 'string' && item.date.includes('T')) {
        normalizedDate = item.date.split('T')[0];
      }
      
      // Debug logging for April 13 data
      if (normalizedDate === '2025-04-13' || (typeof item.date === 'string' && item.date.includes('2025-04-13'))) {
        console.log(`[FIXED Chart] Found April 13 data in chart`, {
          originalDate: item.date,
          normalizedDate,
          hours: item.totalHours
        });
      }
      
      // Create a processed item with normalized date
      const processedItem = {...item, date: normalizedDate};
      
      cumulativeData.set(normalizedDate, processedItem);
    });
    
    // Convert to array sorted by date
    return Array.from(cumulativeData.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Prepare chart data based on chart type
  const chartData = chartType === 'individual' 
    ? prepareIndividualChartData() 
    : prepareCumulativeChartData();

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
                  interval={timeRange === 'week' ? 0 : timeRange === 'month' ? 2 : 'preserveEnd'}
                  minTickGap={5}
                />
                <YAxis 
                  label={{ 
                    value: 'Hours', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                  allowDecimals={false}
                  domain={[0, 'auto']}
                />
                <RechartsTooltip 
                  formatter={(value: number) => [`${value.toFixed(1)} hours`, '']}
                  labelFormatter={(label) => `Date: ${dayjs.utc(label).format('YYYY-MM-DD')}`}
                />
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
                  interval={timeRange === 'week' ? 0 : timeRange === 'month' ? 2 : 'preserveEnd'}
                  minTickGap={5}
                />
                <YAxis 
                  label={{ 
                    value: 'Hours', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                  allowDecimals={false}
                  domain={[0, 'auto']}
                />
                <RechartsTooltip 
                  formatter={(value: number) => [`${value.toFixed(1)} hours`, '']}
                  labelFormatter={(label) => `Date: ${dayjs.utc(label).format('YYYY-MM-DD')}`}
                />
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