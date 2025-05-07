'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getServerById } from '@/app/actions/server/crudActions';
import { Alert, Spin, Typography, Tooltip, Tag, message } from 'antd';
import { CopyOutlined, InfoCircleOutlined, CheckOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ServerDetailHeaderProps {
  serverId: number;
}

const ServerDetailHeader: React.FC<ServerDetailHeaderProps> = ({ serverId }) => {
  const { data: serverData, isLoading, error } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => getServerById(serverId),
  });
  

  if (isLoading) {
    return <div className="flex items-center"><Text strong>Server Details</Text><Spin className="ml-2" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <Text strong>Server Details</Text>
        <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />
      </div>
    );
  }

  if (!serverData) {
    return <Text strong>Server Details</Text>;
  }

  return (
    <div className="w-full">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-col w-full max-w-4xl">
          <Text strong className="text-lg text-white mb-3">Server Details</Text>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
            <ServerInfoItem 
              label="Hostname" 
              value={serverData.hostname} 
            />
            
            <ServerInfoItem 
              label="IPV4" 
              value={serverData.ipv4} 
            />
            
            <ServerInfoItem 
              label="IPV6" 
              value={serverData.ipv6} 
            />
            
          </div>
        </div>
      </div>
    </div>
  );
};

interface ServerInfoItemProps {
  label: string;
  value?: string | null;
  tooltip?: string;
  tag?: {
    color: "success" | "processing" | "error" | "warning" | "default";
    text: string;
  };
}

const ServerInfoItem: React.FC<ServerInfoItemProps> = ({ 
  label, 
  value, 
  tooltip,
  tag 
}) => {
  const [copied, setCopied] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  
  if (!value) return null;
  
  // Truncate long values for display
  const displayValue = value.length > 20 
    ? `${value.substring(0, 15)}...${value.substring(value.length - 5)}` 
    : value;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      messageApi.success('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="flex flex-col items-start w-full">
      {contextHolder}
      <Text type="secondary" className="mb-1 text-xs text-white">{label}</Text>
      <div className="flex items-center w-full max-w-full">
        <Tooltip title={value}>
          <Text className="truncate text-sm text-white" style={{ maxWidth: 'calc(100% - 30px)' }}>
            {displayValue}
          </Text>
        </Tooltip>
        
        <span onClick={handleCopy} className="cursor-pointer ml-1 flex-shrink-0">
          {copied ? (
            <CheckOutlined style={{ color: '#1890ff' }} className="text-xs" />
          ) : (
            <CopyOutlined className="text-gray-400 hover:text-white text-xs" />
          )}
        </span>
        
        {tooltip && (
          <Tooltip title={tooltip}>
            <InfoCircleOutlined className="ml-1 text-gray-400 hover:text-white text-xs flex-shrink-0" />
          </Tooltip>
        )}
        
        {tag && (
          <Tag color={tag.color} className="ml-1 text-xs flex-shrink-0">
            {tag.text}
          </Tag>
        )}
      </div>
    </div>
  );
};

export default ServerDetailHeader;
