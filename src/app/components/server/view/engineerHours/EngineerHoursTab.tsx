'use client';

import { Row, Col, Card } from 'antd';
import EngineerHoursForm from './EngineerHoursForm';
import EngineerHoursList from './EngineerHoursList';

interface EngineerHoursTabProps {
  serverId: number;
}

const EngineerHoursTab: React.FC<EngineerHoursTabProps> = ({ serverId }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <EngineerHoursForm serverId={serverId} />
      </Col>
      <Col xs={24} md={16}>
        <Card title="Hours History" className="h-full">
          <EngineerHoursList serverId={serverId} />
        </Card>
      </Col>
    </Row>
  );
};

export default EngineerHoursTab;