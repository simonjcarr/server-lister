'use client';

import { Card, Spin, Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { getRecentServerActivity } from '@/app/actions/server/serverActivityActions';

const ServerActivityChart = () => {
  const { data: activityData = [], isLoading } = useQuery({
    queryKey: ['recentServerActivity'],
    queryFn: getRecentServerActivity,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Prepare chart data
  const chartData = activityData.map(item => ({
    ...item,
    formattedDate: formatDate(item.date),
  }));

  return (
    <Card
      title="Server Activity (Last 30 Days)"
      className="w-full mb-6"
      styles={{ body: { padding: '12px' } }}
    >
      <div className="h-72">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Spin />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Empty description="No activity data available" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="formattedDate" />
              <YAxis allowDecimals={false} />
              <Tooltip 
                formatter={(value) => [`${value} servers`, '']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="created" 
                name="Servers Added" 
                stroke="#0088FE" 
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="updated" 
                name="Servers Updated" 
                stroke="#00C49F" 
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default ServerActivityChart;
