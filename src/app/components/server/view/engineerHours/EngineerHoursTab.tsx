'use client';

import { useState } from 'react';
import { Row, Col, Card, Button, Modal } from 'antd';
import EngineerHoursForm from './EngineerHoursForm';
import EngineerHoursList from './EngineerHoursList';
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
        <Card title="Hours History" className="h-full">
          <EngineerHoursList serverId={serverId} />
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