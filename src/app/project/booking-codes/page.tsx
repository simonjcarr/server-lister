'use client';

import React from 'react';
import { Tabs, Card, App } from 'antd';
import BookingCodeGroupsList from '@/app/components/bookingCode/BookingCodeGroupsList';
import ProjectBookingCodesList from '@/app/components/bookingCode/ProjectBookingCodesList';

const BookingCodeManagementPage: React.FC = () => {
  const items = [
    {
      key: 'groups',
      label: 'Booking Code Groups',
      children: <BookingCodeGroupsList />,
    },
    {
      key: 'projects',
      label: 'Projects',
      children: <ProjectBookingCodesList />,
    }
  ];

  return (
    <App>
      <div className="container mx-auto p-4">
        <Card title="Booking Code Management">
          <Tabs items={items} defaultActiveKey="groups" />
        </Card>
      </div>
    </App>
  );
};

export default BookingCodeManagementPage;
