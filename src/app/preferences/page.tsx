"use client";

import React from 'react';
import { useSession } from 'next-auth/react';
import { Card, Typography, Tabs, Empty } from 'antd';

const { Title } = Typography;

const PreferencesPage: React.FC = () => {
  const { data: session } = useSession();
  // Will be used when implementing preference storage functionality
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userId = session?.user?.id;

  // Tabs setup for different preference categories
  const tabItems = [
    {
      key: 'general',
      label: 'General Preferences',
      children: (
        <Card>
          <Empty 
            description="No preferences configured yet" 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        </Card>
      )
    },
    {
      key: 'display',
      label: 'Display Settings',
      children: (
        <Card>
          <Empty 
            description="Display preferences will be added here" 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        </Card>
      )
    },
    {
      key: 'notifications',
      label: 'Notification Preferences',
      children: (
        <Card>
          <Empty 
            description="Notification preferences will be added here" 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        </Card>
      )
    }
  ];

  return (
    <div className="p-4">
      <Title level={2}>User Preferences</Title>
      
      <div className="mb-4">
        <p>Configure your personal preferences for the application. Changes will be automatically saved.</p>
      </div>

      <Tabs 
        defaultActiveKey="general" 
        className="mb-8"
        items={tabItems}
      />
    </div>
  );
};

export default PreferencesPage;
