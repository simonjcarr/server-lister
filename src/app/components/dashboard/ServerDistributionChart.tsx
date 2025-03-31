'use client';

import { useState } from 'react';
import { Card, Spin, Empty, Tabs } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getServerCountsByOS, getServerCountsByLocation, getServerCountsByBusiness } from '@/app/actions/server/dashboardActions';

type TabKey = 'os' | 'location' | 'business';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#FF6B6B', '#4CAF50', '#FFC107'];

const ServerDistributionChart = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('os');

  // OS Distribution
  const { data: osCounts = [], isLoading: osLoading } = useQuery({
    queryKey: ['serverCountsByOS'],
    queryFn: getServerCountsByOS,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Location Distribution
  const { data: locationCounts = [], isLoading: locationLoading } = useQuery({
    queryKey: ['serverCountsByLocation'],
    queryFn: getServerCountsByLocation,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Business Distribution
  const { data: businessCounts = [], isLoading: businessLoading } = useQuery({
    queryKey: ['serverCountsByBusiness'],
    queryFn: getServerCountsByBusiness,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Format data for the current active tab
  const getChartData = () => {
    switch (activeTab) {
      case 'os':
        return osCounts.map(item => ({
          name: item.osName,
          value: item.count,
          id: item.osId,
        }));
      case 'location':
        return locationCounts.map(item => ({
          name: item.locationName,
          value: item.count,
          id: item.locationId,
        }));
      case 'business':
        return businessCounts.map(item => ({
          name: item.businessName,
          value: item.count,
          id: item.businessId,
        }));
      default:
        return [];
    }
  };

  const chartData = getChartData();
  const isLoading = activeTab === 'os' ? osLoading : activeTab === 'location' ? locationLoading : businessLoading;

  return (
    <Card
      title="Server Distribution"
      className="w-full mb-6"
      styles={{ body: { padding: '12px' } }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
        items={[
          { key: 'os', label: 'By Operating System' },
          { key: 'location', label: 'By Location' },
          { key: 'business', label: 'By Business' },
        ]}
      />

      <div className="h-72">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Spin />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Empty description="No data available" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} servers`, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default ServerDistributionChart;
