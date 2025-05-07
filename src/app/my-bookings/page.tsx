"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Tabs, Typography, Space, Button } from 'antd';
import { getUserBookingHistory, getUserWeeklyBookingMatrix } from '../actions/server/engineerHours/userBookingsActions';
import { useSession } from 'next-auth/react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Link from 'next/link';
import ClickToCopy from '../components/utils/ClickToCopy';

const { Title, Text } = Typography;

const MyBookingsPage: React.FC = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [weekOffset, setWeekOffset] = useState(0);

  // Get booking history for the current user
  const { data: bookingHistory, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['userBookingHistory', userId],
    queryFn: async () => {
      console.log(`Fetching booking history for user ID: ${userId}`);
      if (!userId) {
        console.warn('No user ID available for booking history fetch');
        return { success: false, data: [], error: 'No user ID available' };
      }
      
      try {
        // Call the server action and log everything
        console.log('Calling getUserBookingHistory with userId:', userId);
        const res = await getUserBookingHistory(userId);
        console.log('Booking history raw response:', JSON.stringify(res, null, 2));
        
        if (!res.success) {
          console.error('Server action returned error:', res.error);
          return { 
            success: false, 
            data: [], 
            error: res.error || 'Server returned an error'
          };
        }
        
        if (!res.data || !Array.isArray(res.data)) {
          console.warn('Server returned non-array data:', res.data);
          return { 
            success: true, 
            data: [], 
            warning: 'Server returned empty or invalid data'
          };
        }
        
        console.log(`Successfully retrieved ${res.data.length} booking entries`);
        return { 
          success: true, 
          data: res.data 
        };
      } catch (error) {
        console.error('Exception when fetching booking history:', error);
        return { 
          success: false, 
          data: [], 
          error: error instanceof Error ? error.message : 'Failed to fetch booking history' 
        };
      }
    },
    enabled: !!userId,
    staleTime: 0, // Don't cache results to ensure fresh data
    retry: 1      // Only retry once on failure
  });

  // Get weekly booking matrix for the current user
  const { data: weeklyMatrix, isLoading: isMatrixLoading, refetch: refetchMatrix } = useQuery({
    queryKey: ['userWeeklyMatrix', userId, weekOffset],
    queryFn: async () => {
      if (!userId) return { success: false, data: null };
      const res = await getUserWeeklyBookingMatrix(userId, weekOffset);
      return res;
    },
    enabled: !!userId,
  });

  // Effect to refetch matrix when week offset changes
  useEffect(() => {
    if (userId) {
      refetchMatrix();
    }
  }, [weekOffset, refetchMatrix, userId]);

  // Column definition for history table
  const historyColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: Date) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Booking Code',
      dataIndex: 'bookingCode',
      key: 'bookingCode',
      render: (text: string) => <ClickToCopy text={text} />,
    },
    {
      title: 'Description',
      dataIndex: 'bookingCodeDescription',
      key: 'bookingCodeDescription',
    },
    {
      title: 'Group',
      dataIndex: 'bookingGroupName',
      key: 'bookingGroupName',
    },
    {
      title: 'Server',
      dataIndex: 'serverName',
      key: 'serverName',
      render: (text: string, record: { serverId: number }) => (
        <Link href={`/server/view/${record.serverId}`}>{text}</Link>
      ),
    },
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string, record: { projectId?: number }) => (
        record.projectId ? <Link href={`/project/${record.projectId}`}>{text}</Link> : '-'
      ),
    },
    {
      title: 'Hours',
      dataIndex: 'minutes',
      key: 'minutes',
      render: (minutes: number) => (minutes / 60).toFixed(1),
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
    },
  ];

  // Navigation for weekly matrix
  const handlePreviousWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const handleCurrentWeek = () => {
    setWeekOffset(0);
  };

  // Tabs items
  const tabItems = [
    {
      key: 'weeklyMatrix',
      label: 'Weekly Matrix',
      children: (
        <Card loading={isMatrixLoading}>
          {weeklyMatrix?.success && weeklyMatrix.data && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <Space>
                  <Button type="primary" onClick={handlePreviousWeek} icon={<LeftOutlined />}>
                    Previous Week
                  </Button>
                  <Button type="default" onClick={handleCurrentWeek}>
                    Current Week
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={handleNextWeek} 
                    icon={<RightOutlined />}
                    disabled={weeklyMatrix.data.isCurrentWeek} // Disable if on current week
                    title={weeklyMatrix.data.isCurrentWeek ? "Cannot view future weeks" : "Next Week"}
                  >
                    Next Week
                  </Button>
                </Space>
                <Text strong>{weeklyMatrix.data.weekRange.display}</Text>
              </div>
              
              {/* Show message for future weeks */}
              {weeklyMatrix.data.isFutureWeek && (
                <div className="text-center py-8">
                  <p>Cannot view booking data for future weeks.</p>
                </div>
              )}
              
              {/* Show message for empty data */}
              {!weeklyMatrix.data.isFutureWeek && weeklyMatrix.data.matrix.length === 0 && (
                <div className="text-center py-8">
                  <p>No booking data found for this week.</p>
                </div>
              )}
              
              {/* Show matrix table only if there's data or it's not a future week */}
              {!weeklyMatrix.data.isFutureWeek && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700 border border-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 bg-gray-800 border border-gray-700">Booking Code</th>
                        {weeklyMatrix.data.daysOfWeek.map(day => (
                          <th key={day.date} className="px-4 py-2 bg-gray-800 border border-gray-700 text-center">
                            <div>{day.dayName}</div>
                            <div className="text-xs">{day.displayDate}</div>
                          </th>
                        ))}
                        <th className="px-4 py-2 bg-gray-800 border border-gray-700 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {weeklyMatrix.data.matrix.length > 0 ? (
                        // Only render rows if we have data
                        <>
                          {weeklyMatrix.data.matrix.map(row => (
                            <tr key={row.bookingCode.id}>
                              <td className="px-4 py-2 border border-gray-700">
                                <div><ClickToCopy text={row.bookingCode.code} /></div>
                                <div className="text-xs text-gray-400">{row.bookingCode.description}</div>
                              </td>
                              {row.dailyMinutes.map((day, index) => (
                                <td key={index} className="px-4 py-2 border border-gray-700 text-center">
                                  {day.displayHours !== '0.0' ? day.displayHours : '-'}
                                </td>
                              ))}
                              <td className="px-4 py-2 border border-gray-700 text-center font-bold">
                                {row.displayTotalHours}
                              </td>
                            </tr>
                          ))}
                          {/* Column Totals Row - always render even if empty */}
                          <tr className="bg-gray-800">
                            <td className="px-4 py-2 border border-gray-700 font-bold">Daily Total</td>
                            {weeklyMatrix.data.columnTotals.map((total, index) => (
                              <td key={index} className="px-4 py-2 border border-gray-700 text-center font-bold">
                                {total.displayHours}
                              </td>
                            ))}
                            <td className="px-4 py-2 border border-gray-700 text-center font-bold bg-gray-800">
                              {weeklyMatrix.data.grandTotalHours}
                            </td>
                          </tr>
                        </>
                      ) : (
                        // Empty state with a single row
                        <tr>
                          <td colSpan={weeklyMatrix.data.daysOfWeek.length + 2} className="text-center p-4">
                            No booking entries for this week
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {(!weeklyMatrix?.success || !weeklyMatrix?.data) && (
            <div className="text-center py-8">
              <p>Error loading booking data. Please try again.</p>
            </div>
          )}
        </Card>
      )
    },
    {
      key: 'bookingHistory',
      label: 'Booking History',
      children: (
        <Card>
          {isHistoryLoading ? (
            <div className="text-center py-8">Loading booking history...</div>
          ) : (
            <>
              {bookingHistory?.success ? (
                <div>
                  {bookingHistory.data && bookingHistory.data.length > 0 ? (
                    <Table 
                      dataSource={bookingHistory.data} 
                      columns={historyColumns}
                      rowKey="id"
                      pagination={{ pageSize: 20 }}
                      scroll={{ x: 'max-content' }}
                      locale={{ emptyText: 'No booking history found' }}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <p>No booking history found.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p>Error loading booking history.</p>
                </div>
              )}
            </>
          )}
        </Card>
      )
    }
  ];

  return (
    <div className="p-4">
      <Title level={2}>My Bookings</Title>
      
      <Tabs 
        defaultActiveKey="weeklyMatrix" 
        className="mb-8"
        items={tabItems}
      />
    </div>
  );
};

export default MyBookingsPage;