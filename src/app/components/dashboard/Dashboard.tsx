'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, Statistic, Row, Col, Button, Spin, Divider, Tooltip, Tabs } from 'antd';
import { WarningOutlined, LockOutlined, DesktopOutlined, CalendarOutlined, ClockCircleOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getDashboardStats } from '@/app/actions/server/dashboardActions';
import { useRouter } from 'next/navigation';
import ServerDistributionChart from './ServerDistributionChart';
import ServerActivityChart from './ServerActivityChart';
import { DashboardStats } from '@/app/types/dashboard';
import { TabsProps } from 'antd';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

// Interface for the component props
interface DashboardProps {
  onTabChange?: (activeKey: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onTabChange }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('servers');
  const { data: session } = useSession();
  console.log(session);
  const { data: dashboardStats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (onTabChange) {
      onTabChange(key);
    }
  };

  const handleViewNonOnboardedServers = () => {
    // Navigate to server list with filter for non-onboarded servers
    router.push('/server?onboardingStatus=not_onboarded');
  };
  
  const handleViewBookingCodes = (tabKey?: string) => {
    // Navigate to booking code management page
    const path = tabKey ? `/project/booking-codes?tab=${tabKey}` : '/project/booking-codes';
    router.push(path);
  };
  
  const navigateToBookingCodeReport = () => {
    // Navigate to the booking code status report
    router.push('/reports/report/booking_code_status');
  };

  // Server tab content component
  const ServersTabContent = () => (
    <Row gutter={[16, 16]}>
      {/* Server Overview Section */}
      <Col span={24}>
        <Divider orientation="left">Server Overview</Divider>
      </Col>
      
      <Col xs={24} sm={12} md={6} lg={6} xl={6}>
        <Card hoverable className="transition-all hover:shadow-md">
          <Statistic
            title="Total Servers"
            value={dashboardStats?.totalServers || 0}
            prefix={<DesktopOutlined style={{ color: '#1890ff' }} />}
          />
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6} lg={6} xl={6}>
        <Card 
          hoverable 
          onClick={handleViewNonOnboardedServers}
          className="cursor-pointer transition-all hover:shadow-md"
        >
          <Statistic
            title="Servers Not Onboarded"
            value={dashboardStats?.nonOnboardedServers || 0}
            prefix={<WarningOutlined style={{ color: '#faad14' }} />}
          />
          <div className="mt-4">
            <Button type="primary" size="small" onClick={handleViewNonOnboardedServers}>
              View Details
            </Button>
          </div>
        </Card>
      </Col>
      
      <Col xs={24} sm={12} md={6} lg={6} xl={6}>
        <Card hoverable className="transition-all hover:shadow-md">
          <Statistic
            title="ITAR Servers"
            value={dashboardStats?.itarServers || 0}
            prefix={<LockOutlined style={{ color: '#f5222d' }} />}
          />
        </Card>
      </Col>

      {/* Distribution Charts Section */}
      <Col span={24}>
        <Divider orientation="left">Server Distributions</Divider>
      </Col>
      
      <Col xs={24} md={24} lg={12} xl={12} className="mb-6">
        <ServerDistributionChart />
      </Col>
      
      <Col xs={24} md={24} lg={12} xl={12} className="mb-6">
        <ServerActivityChart />
      </Col>
    </Row>
  );

  // Project tab content component
  const ProjectsTabContent = () => (
    <Row gutter={[16, 16]}>
      {/* Booking Code Status Section */}
      <Col span={24}>
        <Divider orientation="left">Booking Code Status</Divider>
      </Col>
      
      <Col xs={24} sm={12} md={6} lg={6} xl={6}>
        <Tooltip title="Groups where all booking codes have expired">
          <Card 
            hoverable 
            className="cursor-pointer transition-all hover:shadow-md"
            onClick={navigateToBookingCodeReport}
          >
            <Statistic
              title="Expired Booking Codes"
              value={dashboardStats?.bookingCodeStatuses?.expired || 0}
              prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
            />
            <div className="mt-4">
              <Button type="primary" size="small" danger onClick={(e) => {
                e.stopPropagation();
                navigateToBookingCodeReport();
              }}>
                View Report
              </Button>
            </div>
          </Card>
        </Tooltip>
      </Col>
      
      <Col xs={24} sm={12} md={6} lg={6} xl={6}>
        <Tooltip title="Groups where all booking codes will expire within 1 month">
          <Card 
            hoverable 
            className="cursor-pointer transition-all hover:shadow-md"
            onClick={navigateToBookingCodeReport}
          >
            <Statistic
              title="Expiring Soon"
              value={dashboardStats?.bookingCodeStatuses?.expiringSoon || 0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            />
            <div className="mt-4">
              <Button type="primary" size="small" onClick={(e) => {
                e.stopPropagation();
                navigateToBookingCodeReport();
              }}>
                View Report
              </Button>
            </div>
          </Card>
        </Tooltip>
      </Col>
      
      <Col xs={24} sm={12} md={6} lg={6} xl={6}>
        <Tooltip title="Groups with no booking codes">
          <Card 
            hoverable 
            className="cursor-pointer transition-all hover:shadow-md"
            onClick={navigateToBookingCodeReport}
          >
            <Statistic
              title="No Booking Codes"
              value={dashboardStats?.bookingCodeStatuses?.noCodes || 0}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
            />
            <div className="mt-4">
              <Button type="primary" size="small" onClick={(e) => {
                e.stopPropagation();
                navigateToBookingCodeReport();
              }}>
                View Report
              </Button>
            </div>
          </Card>
        </Tooltip>
      </Col>
      
      <Col xs={24} sm={12} md={6} lg={6} xl={6}>
        <Tooltip title="Groups with active booking codes valid beyond 1 month">
          <Card 
            hoverable 
            className="cursor-pointer transition-all hover:shadow-md"
            onClick={() => handleViewBookingCodes('groups')}
          >
            <Statistic
              title="Active Booking Codes"
              value={dashboardStats?.bookingCodeStatuses?.active || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
            <div className="mt-4">
              <Button type="primary" size="small" onClick={(e) => {
                e.stopPropagation();
                handleViewBookingCodes('groups');
              }}>
                View Details
              </Button>
            </div>
          </Card>
        </Tooltip>
      </Col>
    </Row>
  );

  // Define the tabs
  const items: TabsProps['items'] = [
    {
      key: 'servers',
      label: 'Servers',
      children: <ServersTabContent />
    },
    {
      key: 'projects',
      label: 'Projects',
      children: <ProjectsTabContent />
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Spin size="large" />
        </div>
      ) : (
        <Tabs 
          defaultActiveKey="servers" 
          activeKey={activeTab}
          onChange={handleTabChange}
          items={items}
          size="large"
          className="dashboard-tabs"
        />
      )}
    </div>
  );
};

export default Dashboard;
