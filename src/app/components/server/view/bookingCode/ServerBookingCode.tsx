'use client';

import { useQuery } from '@tanstack/react-query';
import { Alert, Spin, Tag, Typography } from 'antd';
import ClickToCopy from '@/app/components/utils/ClickToCopy';
import { getServerBookingCode } from '@/app/actions/server/bookingCode/getServerBookingCode';

const { Text } = Typography;

const ServerBookingCode = ({ serverId }: { serverId: number }) => {
  const { data: bookingCode, isLoading, error } = useQuery({
    queryKey: ['serverBookingCode', serverId],
    queryFn: () => getServerBookingCode(serverId),
  });

  if (isLoading) {
    return <Spin size="small" />;
  }

  if (error) {
    return <Alert message="Error loading booking code" type="error" showIcon />;
  }

  if (!bookingCode) {
    return <Text type="secondary">No booking code assigned</Text>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Text strong>Booking Code:</Text>
        <ClickToCopy text={bookingCode.code} />
        {bookingCode.isExpired && (
          <Tag color="error">Expired</Tag>
        )}
      </div>
      
      <div className="text-xs text-gray-500">
        <div>Group: {bookingCode.groupName}</div>
        <div>
          Valid: {new Date(bookingCode.validFrom).toLocaleDateString()} - {new Date(bookingCode.validTo).toLocaleDateString()}
        </div>
        {bookingCode.description && <div>Description: {bookingCode.description}</div>}
      </div>
    </div>
  );
};

export default ServerBookingCode;
