'use client';

import React, { useState } from 'react';
import { Card, Table, Spin, Empty, Radio, Switch, Space, Typography, InputNumber } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getDashboardEngineerHoursMatrix } from '@/app/actions/server/engineerHours/dashboardActions';
import type { ColumnsType } from 'antd/es/table';
import { CalendarOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Types for the component props
interface DashboardEngineerHoursMatrixProps {
  className?: string; // Optional prop for styling flexibility
}

// Types for the matrix data with project breakdown
interface ProjectMatrixRow {
  project: {
    id: number;
    name: string;
  };
  periodHours: {
    [key: string]: number;
  };
  totalHours: number;
}

// Matrix data is handled directly through the ProjectMatrixRow type

const DashboardEngineerHoursMatrix: React.FC<DashboardEngineerHoursMatrixProps> = () => {
  // State for display options
  const [showByProject, setShowByProject] = useState(true);
  const [periodsToShow, setPeriodsToShow] = useState(12);
  
  // State for time grouping
  const [timeGrouping, setTimeGrouping] = useState<'week' | 'month' | 'year'>('month');
  
  // Query for the matrix data
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardEngineerHoursMatrix', timeGrouping, showByProject, periodsToShow],
    queryFn: () => getDashboardEngineerHoursMatrix(timeGrouping, showByProject, periodsToShow),
  });
  
  // Function to handle breakdown mode change
  const handleBreakdownModeChange = (checked: boolean) => {
    setShowByProject(checked);
  };
  
  // Function to handle periods to show change
  const handlePeriodsToShowChange = (value: number | null) => {
    if (value !== null) {
      setPeriodsToShow(value);
    }
  };
  
  // Generate columns for the table based on the data
  const getColumns = () => {
    if (!data?.success || !data.data) {
      return [];
    }
    
    const matrixData = data.data;
    // Get periods, but limit to the last periodsToShow
    const allPeriods = matrixData.periods;
    const periods = allPeriods.slice(-periodsToShow);
    
    const baseColumns: ColumnsType<ProjectMatrixRow> = [
      {
        title: 'Project',
        dataIndex: ['project', 'name'],
        key: 'project',
        fixed: 'left',
        width: 180,
        render: (text: string, record: ProjectMatrixRow) => (
          <div>
            {record.project.id === 0 ? (
              <Text strong>{text}</Text>
            ) : (
              <Text>{text}</Text>
            )}
          </div>
        ),
      },
    ];
    
    // Add a column for each period
    const periodColumns = periods.map(period => ({
      title: (
        <div className="text-xs">
          <CalendarOutlined className="mr-1" />
          <div>{period.label}</div>
        </div>
      ),
      key: `period-${period.key}`,
      align: 'center' as const,
      render: (text: string, record: ProjectMatrixRow) => {
        // Calculate the value for protection against data cross-contamination
        const hours = record.periodHours?.[period.key] || 0;
        
        if (hours <= 0) return <Text className={record.project.id === 0 ? 'font-bold' : ''}>-</Text>;
        return <Text className={record.project.id === 0 ? 'font-bold' : ''}>{hours.toFixed(1)}</Text>;
      },
    }));
    
    // Add a total column
    const totalColumn = {
      title: <div className="text-xs">Total</div>,
      key: 'total',
      align: 'center' as const,
      fixed: 'right' as const,
      width: 100,
      render: (text: string, record: ProjectMatrixRow) => {
        // Calculate total from the record to ensure it's accurate
        let totalHours = 0;
        periods.forEach(period => {
          totalHours += record.periodHours[period.key] || 0;
        });
        
        if (totalHours <= 0) return <Text className={record.project.id === 0 ? 'font-bold' : ''}>-</Text>;
        return <Text className={record.project.id === 0 ? 'font-bold' : ''}>{totalHours.toFixed(1)}</Text>;
      },
    };
    
    return [...baseColumns, ...periodColumns, totalColumn];
  };
  
  // Generate data source for the table
  const getDataSource = () => {
    if (!data?.success || !data.data) {
      return [];
    }
    
    const matrixData = data.data;
    
    if (!showByProject) {
      // If not showing by project, just return the totals row
      const totalsRow = matrixData.matrix.find(row => row.project.id === 0);
      if (totalsRow) {
        return [totalsRow];
      }
      return [];
    }
    
    // Otherwise return all matrix rows
    return matrixData.matrix;
  };
  
  // Render function for loading state
  if (isLoading) {
    return (
      <Card title="Engineer Hours Matrix" size="small" className="mb-4">
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
  if (error) {
    return (
      <Card title="Engineer Hours Matrix" size="small" className="mb-4">
        <Empty 
          description="Error loading matrix data"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }
  
  // Check if we have data
  const hasData = data?.success && data.data && data.data.matrix && data.data.matrix.length > 0;
  
  return (
    <Card
      title="Engineer Hours Matrix"
      size="small"
      className="mb-4"
      extra={
        <Space size="small">
          <Space size="small">
            <Text className="text-xs">Show:</Text>
            <InputNumber
              min={1}
              max={24}
              value={periodsToShow}
              onChange={handlePeriodsToShowChange}
              size="small"
            />
            <Text className="text-xs">{timeGrouping}s</Text>
          </Space>
        </Space>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <Radio.Group 
          value={timeGrouping} 
          onChange={(e) => setTimeGrouping(e.target.value)} 
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="week">Weeks</Radio.Button>
          <Radio.Button value="month">Months</Radio.Button>
          <Radio.Button value="year">Years</Radio.Button>
        </Radio.Group>

        <Space size="small">
          <Text className="text-xs">Show by project:</Text>
          <Switch 
            checked={showByProject} 
            onChange={handleBreakdownModeChange} 
            size="small"
          />
        </Space>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <Spin spinning={true} size="small">
            <div className="h-12 flex items-center justify-center text-xs text-gray-500">
              Loading data...
            </div>
          </Spin>
        </div>
      ) : !hasData ? (
        <Empty description="No engineer hours data available for any projects" />
      ) : (
        <Table
          columns={getColumns()}
          dataSource={getDataSource()}
          rowKey={(record: any) => record.engineer ? `${record.project.id}-${record.engineer.id}` : record.project.id}
          pagination={false}
          scroll={{ x: 'max-content' }} // Ensure horizontal scroll for many periods
          size="small"
          bordered
        />
      )}
    </Card>
  );
};

export default DashboardEngineerHoursMatrix;