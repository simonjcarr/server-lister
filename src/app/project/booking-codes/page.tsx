'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, Card, App } from 'antd';
import BookingCodeGroupsList from '@/app/components/bookingCode/BookingCodeGroupsList';
import ProjectBookingCodesList from '@/app/components/bookingCode/ProjectBookingCodesList';
import { useSearchParams } from 'next/navigation';

const BookingCodeManagementPage: React.FC = () => {
  const searchParams = useSearchParams();
  const [activeKey, setActiveKey] = useState<string>('groups');
  
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['groups', 'projects'].includes(tab)) {
      setActiveKey(tab);
    }
  }, [searchParams]);
  
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
          <Tabs 
            items={items} 
            activeKey={activeKey}
            onChange={setActiveKey}
          />
        </Card>
      </div>
    </App>
  );
};

export default BookingCodeManagementPage;
