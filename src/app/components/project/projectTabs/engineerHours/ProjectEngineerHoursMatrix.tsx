'use client';

import React, { useState } from 'react';
import { Card, Table, Spin, Empty, Alert, Radio, Switch, Space, Typography, RadioChangeEvent, InputNumber } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getProjectEngineerHoursMatrix } from '@/app/actions/server/engineerHours/reportActions';
import type { ColumnsType } from 'antd/es/table';
import { CalendarOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { Group: RadioGroup, Button: RadioButton } = Radio;

// Types for the component props
interface ProjectEngineerHoursMatrixProps {
  projectId: number;
}

// Types for the matrix data with engineer breakdown
interface EngineerMatrixRow {
  engineer: {
    id: string;
    name: string;
  };
  periodHours: {
    [key: string]: number;
  };
  totalHours: number;
}

// Types for matrix data with just totals
interface TotalsMatrixData {
  periods: {
    key: string;
    label: string;
    startDate: string;
    endDate: string;
  }[];
  periodTotals: {
    [key: string]: number;
  };
  grandTotal: number;
  totalsIncluded: boolean;
}

// Types for matrix data with engineer breakdown
interface EngineerMatrixData {
  periods: {
    key: string;
    label: string;
    startDate: string;
    endDate: string;
  }[];
  engineers: {
    id: string;
    name: string;
  }[];
  matrix: EngineerMatrixRow[];
  totalsIncluded: boolean;
}

// Combined type for the matrix data response
type MatrixData = EngineerMatrixData | TotalsMatrixData;

// Function to check if the data is engineer matrix data
function isEngineerMatrixData(data: MatrixData): data is EngineerMatrixData {
  return 'matrix' in data && Array.isArray(data.matrix);
}

const ProjectEngineerHoursMatrix: React.FC<ProjectEngineerHoursMatrixProps> = ({ projectId }) => {
  // State for the time grouping and display mode
  const [timeGrouping, setTimeGrouping] = useState<'week' | 'month' | 'year'>('month');
  const [showByEngineer, setShowByEngineer] = useState(true);
  const [periodsToShow, setPeriodsToShow] = useState(12);
  
  // Query for the matrix data
  const { data, isLoading, error } = useQuery({
    queryKey: ['projectEngineerHoursMatrix', projectId, timeGrouping, showByEngineer, periodsToShow],
    queryFn: () => getProjectEngineerHoursMatrix(projectId, timeGrouping, showByEngineer, periodsToShow),
    enabled: !!projectId,
  });
  
  // Function to handle time grouping change
  const handleTimeGroupingChange = (e: RadioChangeEvent) => {
    setTimeGrouping(e.target.value);
  };
  
  // Function to handle breakdown mode change
  const handleBreakdownModeChange = (checked: boolean) => {
    setShowByEngineer(checked);
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
    const periods = matrixData.periods;
    
    const baseColumns: ColumnsType<any> = [
      {
        title: 'Engineer',
        dataIndex: ['engineer', 'name'],
        key: 'engineer',
        fixed: 'left',
        width: 180,
        render: (text: string, record: any) => (
          <div>
            {record.engineer.id === 'total' ? (
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
      dataIndex: ['periodHours', period.key],
      key: `period-${period.key}`,
      align: 'center' as const,
      render: (hours: number, record: any) => {
        if (hours <= 0) return <Text className={record.engineer.id === 'total' ? 'font-bold' : ''}>-</Text>;
        return <Text className={record.engineer.id === 'total' ? 'font-bold' : ''}>{hours.toFixed(1)}</Text>;
      },
    }));
    
    // Add a total column
    const totalColumn = {
      title: <div className="text-xs">Total</div>,
      dataIndex: 'totalHours',
      key: 'total',
      align: 'center' as const,
      fixed: 'right' as const,
      width: 100,
      render: (hours: number, record: any) => {
        if (hours <= 0) return <Text className={record.engineer.id === 'total' ? 'font-bold' : ''}>-</Text>;
        return <Text className={record.engineer.id === 'total' ? 'font-bold' : ''}>{hours.toFixed(1)}</Text>;
      },
    };
    
    return [...baseColumns, ...periodColumns, totalColumn];
  };
  
  // Generate data source for the table based on display mode
  const getDataSource = () => {
    if (!data?.success || !data.data) {
      return [];
    }
    
    const matrixData = data.data;
    
    if (isEngineerMatrixData(matrixData)) {
      // Return the matrix rows directly for engineer breakdown
      return matrixData.matrix.map(row => ({
        key: row.engineer.id,
        engineer: row.engineer,
        periodHours: row.periodHours,
        totalHours: row.totalHours,
      }));
    } else {
      // For totals only, create a single row
      return [
        {
          key: 'total',
          engineer: { id: 'total', name: 'Total Hours' },
          periodHours: matrixData.periodTotals,
          totalHours: matrixData.grandTotal,
        },
      ];
    }
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
        <Alert
          type="error"
          message="Error loading matrix data"
          description={error instanceof Error ? error.message : 'An unknown error occurred'}
        />
      </Card>
    );
  }
  
  // Check if we have data
  const hasData = data?.success && data.data && 
    (isEngineerMatrixData(data.data) ? data.data.matrix.length > 0 : true);
  
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
        <RadioGroup 
          value={timeGrouping} 
          onChange={handleTimeGroupingChange}
          size="small"
        >
          <RadioButton value="week">Weeks</RadioButton>
          <RadioButton value="month">Months</RadioButton>
          <RadioButton value="year">Years</RadioButton>
        </RadioGroup>
        
        <Space>
          <Text className="text-xs mr-2">Show by engineer:</Text>
          <Switch
            checkedChildren={<TeamOutlined />}
            unCheckedChildren={<UserOutlined />}
            checked={showByEngineer}
            onChange={handleBreakdownModeChange}
            size="small"
          />
        </Space>
      </div>
      
      {!hasData ? (
        <Empty description="No engineer hours data available for this project" />
      ) : (
        <Table
          columns={getColumns()}
          dataSource={getDataSource()}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          bordered
        />
      )}
    </Card>
  );
};

export default ProjectEngineerHoursMatrix;