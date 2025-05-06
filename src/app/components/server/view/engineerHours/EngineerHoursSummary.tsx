'use client';

import React, { useState } from 'react';
import { Card, Spin, Empty, Radio, Select, Space, Alert, RadioChangeEvent } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { 
  getEngineerHoursChartData, 
  getCumulativeEngineerHoursChartData 
} from '@/app/actions/server/engineerHours/reportActions';
import {
  getProjectEngineerHoursSummary,
  getBookingCodeGroupEngineerHoursSummary
} from '@/app/actions/server/engineerHours/crudActions';
import dayjs from 'dayjs';
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
type SummaryType = 'server' | 'project' | 'bookingCodeGroup';

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

interface EngineerHoursSummaryProps {
  summaryType: SummaryType;
  entityId: number;
  title?: string;
  showControls?: boolean;
  compactMode?: boolean;
  defaultTimeRange?: TimeRange;
  defaultChartType?: ChartType;
  defaultChartStyle?: ChartStyle;
}

const COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

const EngineerHoursSummary: React.FC<EngineerHoursSummaryProps> = ({ 
  summaryType, 
  entityId,
  title,
  showControls = true,
  compactMode = false,
  defaultTimeRange = 'month',
  defaultChartType = 'cumulative',
  defaultChartStyle = 'line'
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultTimeRange);
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);
  const [chartStyle, setChartStyle] = useState<ChartStyle>(defaultChartStyle);

  // Choose the right query based on summary type
  const { data: chartsData, isLoading, error } = useQuery({
    queryKey: [`${summaryType}EngineerHoursSummary`, entityId, timeRange, chartType],
    queryFn: async () => {
      switch (summaryType) {
        case 'server':
          return chartType === 'individual' 
            ? getEngineerHoursChartData({ serverId: entityId, timeRange })
            : getCumulativeEngineerHoursChartData({ serverId: entityId, timeRange });
        case 'project':
          return getProjectEngineerHoursSummary(entityId, timeRange, chartType);
        case 'bookingCodeGroup':
          return getBookingCodeGroupEngineerHoursSummary(entityId, timeRange, chartType);
        default:
          throw new Error(`Unsupported summary type: ${summaryType}`);
      }
    },
  });
    
  // Extract time range boundaries for chart display
  const timeRangeBoundaries = chartsData?.success ? chartsData.timeRangeBoundaries : null;

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
    
    // Now populate with actual data
    (chartsData.data as EngineerDataPoint[]).forEach(item => {
      if (!chartDataByDate.has(item.date)) {
        chartDataByDate.set(item.date, { date: item.date });
      }
      
      const dateEntry = chartDataByDate.get(item.date);
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

  // Process data for cumulative chart
  const prepareCumulativeChartData = () => {
    if (!chartsData?.success || !chartsData.data) return [];
    
    const cumulativeData = new Map();
    
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
        
        if (!cumulativeData.has(dateKey)) {
          cumulativeData.set(dateKey, { 
            date: dateKey,
            totalHours: 0,
            totalMinutes: 0 
          });
        }
      }
    }
    
    // Now add the actual data
    chartsData.data.forEach(item => {
      cumulativeData.set(item.date, item);
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
    let displayTitle = title || "Engineer Hours Summary";
    
    // Add time range if no custom title is provided
    if (!title) {
      switch (timeRange) {
        case 'week': displayTitle += " (Last Week)"; break;
        case 'month': displayTitle += " (Last Month)"; break;
        case '6months': displayTitle += " (Last 6 Months)"; break;
        case 'year': displayTitle += " (Last Year)"; break;
        case 'all': displayTitle += " (All Time)"; break;
      }
    }
    
    return displayTitle;
  };

  // Calculate total hours
  const totalHours = chartData.reduce((sum, item) => {
    if (chartType === 'cumulative') {
      return sum + (item.totalHours as number || 0);
    } else {
      // For individual chart, sum all engineer values
      let dayTotal = 0;
      Array.from(engineers.values()).forEach(engineer => {
        dayTotal += (item[engineer.name] as number || 0);
      });
      return sum + dayTotal;
    }
  }, 0);

  return (
    <Card
      title={getChartTitle()}
      className="w-full mb-6"
      size={compactMode ? "small" : "default"}
      styles={{ body: { padding: compactMode ? '8px' : '12px' } }}
      extra={
        showControls ? (
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
              size={compactMode ? "small" : "middle"}
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
              size={compactMode ? "small" : "middle"}
            />
          </Space>
        ) : (
          <div className="text-sm font-medium">
            Total: {totalHours.toFixed(1)} hours
          </div>
        )
      }
    >
      {/* Time range selector */}
      {showControls && (
        <div className="mb-4 flex justify-center">
          <Radio.Group
            value={timeRange}
            onChange={handleTimeRangeChange}
            buttonStyle="solid"
            size={compactMode ? "small" : "middle"}
          >
            <Radio.Button value="week">Week</Radio.Button>
            <Radio.Button value="month">Month</Radio.Button>
            <Radio.Button value="6months">6 Months</Radio.Button>
            <Radio.Button value="year">Year</Radio.Button>
            <Radio.Button value="all">All Time</Radio.Button>
          </Radio.Group>
        </div>
      )}

      {/* Chart container */}
      <div className={compactMode ? "h-44" : "h-72"}>
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
                  label={compactMode ? undefined : { 
                    value: 'Hours', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                  allowDecimals={false}
                  domain={[0, 'auto']}
                />
                <RechartsTooltip />
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
                  label={compactMode ? undefined : { 
                    value: 'Hours', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                  allowDecimals={false}
                  domain={[0, 'auto']}
                />
                <RechartsTooltip />
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

export default EngineerHoursSummary;