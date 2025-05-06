'use client';

import React, { useState } from 'react';
import { Table, Card, Typography, Spin, Empty, InputNumber, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { getWeeklyEngineerHoursMatrix } from '@/app/actions/server/engineerHours/crudActions';
import { CalendarOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface EngineerData {
  id: string;
  name: string;
}

interface WeekData {
  start: string;
  end: string;
  weekNumber: number;
  year: number;
  label: string;
}

interface WeeklyHoursData {
  minutes: number;
  hours: number;
}

interface MatrixRow {
  engineer: EngineerData;
  weeklyHours: WeeklyHoursData[];
}

interface MatrixData {
  weeks: WeekData[];
  engineers: EngineerData[];
  matrix: MatrixRow[];
}

interface WeeklyEngineerMatrixProps {
  serverId: number;
}

const WeeklyEngineerMatrix: React.FC<WeeklyEngineerMatrixProps> = ({ serverId }) => {
  const [weeksToShow, setWeeksToShow] = useState(4);

  const { data, isLoading, error } = useQuery({
    queryKey: ['engineerHoursMatrix', serverId, weeksToShow],
    queryFn: () => getWeeklyEngineerHoursMatrix(serverId, weeksToShow),
    enabled: !!serverId,
  });

  // Use default empty data structure if no data or query was unsuccessful
  const matrixData = (data?.success ? data.data : { weeks: [], engineers: [], matrix: [] }) as MatrixData;

  if (isLoading) {
    return (
      <Card 
        title={<div className="text-base font-medium">Weekly Engineer Hours Matrix</div>}
        size="small"
        className="mb-4"
      >
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

  if (error) {
    return (
      <Card 
        title={<div className="text-base font-medium">Weekly Engineer Hours Matrix</div>}
        size="small"
        className="mb-4"
      >
        <div className="flex justify-center items-center py-2">
          <Text type="danger" className="text-xs">Failed to load weekly hours data</Text>
        </div>
      </Card>
    );
  }

  if (!matrixData.matrix.length) {
    return (
      <Card 
        title={<div className="text-base font-medium">Weekly Engineer Hours Matrix</div>}
        size="small"
        className="mb-4"
        extra={
          <Space size="small">
            <Text className="text-xs">Weeks to show:</Text>
            <InputNumber
              min={1}
              max={12}
              value={weeksToShow}
              onChange={(value) => setWeeksToShow(value || 4)}
              size="small"
            />
          </Space>
        }
      >
        <div className="py-3">
          <Empty 
            description={<span className="text-xs">No engineer hours data available</span>}
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        </div>
      </Card>
    );
  }

  // Create columns for the table
  const columns: ColumnsType<MatrixRow> = [
    {
      title: <div className="text-xs">Engineer</div>,
      dataIndex: ['engineer', 'name'],
      key: 'engineer',
      fixed: 'left',
      width: 180,
    },
    ...matrixData.weeks.map((week, index) => ({
      title: (
        <div className="text-xs">
          <CalendarOutlined className="mr-1" />
          <div>{week.label}</div>
        </div>
      ),
      dataIndex: ['weeklyHours', index, 'minutes'],
      key: `week-${week.year}-${week.weekNumber}`,
      align: 'center' as const,
      render: (minutes: number) => {
        if (minutes <= 0) return <Text>-</Text>;
        
        // Convert minutes to hh:mm format
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return <Text>{`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`}</Text>;
      },
    })),
    {
      title: <div className="text-xs">Total</div>,
      key: 'total',
      align: 'center' as const,
      render: (_, record) => {
        const totalMinutes = record.weeklyHours.reduce((sum, week) => sum + week.minutes, 0);
        
        if (totalMinutes <= 0) return <Text strong>-</Text>;
        
        // Convert minutes to hh:mm format
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return <Text strong>{`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`}</Text>;
      },
    },
  ];

  return (
    <Card 
      title={<div className="text-base font-medium">Weekly Engineer Hours Matrix</div>}
      className="mb-4"
      size="small"
      extra={
        <Space size="small">
          <Text className="text-xs">Weeks to show:</Text>
          <InputNumber
            min={1}
            max={12}
            value={weeksToShow}
            onChange={(value) => setWeeksToShow(value || 4)}
            size="small"
          />
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={matrixData.matrix}
        rowKey={(record) => record.engineer.id}
        pagination={false}
        scroll={{ x: 'max-content' }}
        bordered
        size="small"
      />
    </Card>
  );
};

export default WeeklyEngineerMatrix;