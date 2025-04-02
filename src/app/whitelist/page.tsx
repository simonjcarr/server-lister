'use client';

import { Card, Button, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import { SoftwareWhitelistTable } from '../components/whitelist/SoftwareWhitelistTable';

const { Title } = Typography;

export default function WhitelistManagementPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <ProtectedRoute>
      {contextHolder}
      <div className="space-y-6">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <Title level={4}>Software Whitelist Management</Title>
            <Button 
              type="primary" 
              onClick={() => router.push('/whitelist/add')}
            >
              Add New Software
            </Button>
          </div>
          
          <SoftwareWhitelistTable />
        </Card>
      </div>
    </ProtectedRoute>
  );
}
