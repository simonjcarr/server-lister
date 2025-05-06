'use client';

import { useState } from 'react';
import { Row, Col, Card, Button, Modal, Tabs } from 'antd';
import EngineerHoursForm from './EngineerHoursForm';
import EngineerHoursList from './EngineerHoursList';
import EngineerHoursChart from './EngineerHoursChart';
import WeeklyEngineerMatrix from './WeeklyEngineerMatrix';
import { PlusOutlined } from '@ant-design/icons';

interface EngineerHoursTabProps {
  serverId: number;
}

const EngineerHoursTab: React.FC<EngineerHoursTabProps> = ({ serverId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSuccess = () => {
    setIsModalVisible(false);
  };

  const items = [
    {
      key: 'list',
      label: 'Hours List',
      children: <EngineerHoursList serverId={serverId} />
    },
    {
      key: 'chart',
      label: 'Hours Chart',
      children: <EngineerHoursChart serverId={serverId} />
    },
    {
      key: 'matrix',
      label: 'Weekly Matrix',
      children: <WeeklyEngineerMatrix serverId={serverId} />
    }
  ];

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <div className="mb-4 flex justify-end">
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showModal}
          >
            Log Hours
          </Button>
        </div>
        <Card className="h-full">
          <Tabs defaultActiveKey="list" items={items} />
        </Card>
      </Col>

      <Modal
        title="Log Engineer Hours"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <EngineerHoursForm 
          serverId={serverId} 
          onSuccess={handleSuccess} 
        />
      </Modal>
    </Row>
  );
};

export default EngineerHoursTab;