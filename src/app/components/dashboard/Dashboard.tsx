'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, Statistic, Row, Col, Button, Spin, Divider } from 'antd';
import { WarningOutlined, LockOutlined, DesktopOutlined } from '@ant-design/icons';
import { getDashboardStats } from '@/app/actions/server/dashboardActions';
import { useRouter } from 'next/navigation';
import ServerDistributionChart from './ServerDistributionChart';
import ServerActivityChart from './ServerActivityChart';

const Dashboard = () => {
  const router = useRouter();

  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleViewNonOnboardedServers = () => {
    // Navigate to server list with filter for non-onboarded servers
    router.push('/server?onboardingStatus=not_onboarded');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Spin size="large" />
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default Dashboard;
