import React, { useEffect, useState } from 'react';
import { Button, Card, Empty, Space, Typography, List, Tag, Spin, Divider, Collapse, Radio, Table, Row, Col, Popconfirm, message } from 'antd';
import { EditOutlined, CloudServerOutlined, LinkOutlined, DatabaseOutlined, AppstoreOutlined, UnorderedListOutlined, TableOutlined, DeleteOutlined } from '@ant-design/icons';
import { SelectDrawing } from '@/db/schema';
import { useQuery } from '@tanstack/react-query';
import { getDrawingServers } from '@/app/actions/drawings/serverDrawings/serverDrawingActions';
import Link from 'next/link';

const { Title } = Typography;

interface DrawingPreviewProps {
  drawing: SelectDrawing | null;
  onEdit: () => void;
  onClose: () => void;
  onDelete?: (drawingId: number) => void;
  isDeleting?: boolean;
}

const DrawingPreview: React.FC<DrawingPreviewProps> = ({ drawing, onEdit, onClose, onDelete, isDeleting = false }) => {
  if (!drawing) {
    return <Empty description="No drawing selected" />;
  }
  
  // State for view type (list, grid, or table)
  const [viewType, setViewType] = useState<'list' | 'grid' | 'table'>('list');
  
  // Query to fetch servers associated with this drawing
  const { data: linkedServers, isLoading: serversLoading } = useQuery({
    queryKey: ['drawing-servers', drawing.id],
    queryFn: () => getDrawingServers(drawing.id),
    enabled: !!drawing
  });

  // Table columns configuration
  const columns = [
    {
      title: 'Hostname',
      dataIndex: 'hostname',
      key: 'hostname',
      render: (_: string, record: any) => (
        <Link href={`/server/view/${record.id}`}>
          <span style={{ color: '#1890ff', cursor: 'pointer' }}>{record.hostname}</span>
        </Link>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipv4',
      key: 'ipv4',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: string, record: any) => (
        <Link href={`/server/view/${record.id}`}>
          <Button type="primary" size="small" icon={<LinkOutlined />}>View</Button>
        </Link>
      ),
    },
  ];

  // Render server item for grid view
  const renderGridItem = (server: any) => (
    <Col xs={24} sm={12} md={8} lg={8} xl={6} xxl={4} key={server.id} style={{ marginBottom: 16 }}>
      <Card
        hoverable
        size="small"
        style={{ height: '100%' }}
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CloudServerOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            <Typography.Text ellipsis style={{ maxWidth: 'calc(100% - 24px)' }}>
              {server.hostname}
            </Typography.Text>
          </div>
        }
        actions={[
          <Link href={`/server/view/${server.id}`} key="view">
            <Button type="link" icon={<LinkOutlined />}>View Server</Button>
          </Link>
        ]}
      >
        {server.ipv4 && (
          <div style={{ marginBottom: 8 }}>
            <Typography.Text type="secondary">IP: </Typography.Text>
            <Typography.Text copyable>{server.ipv4}</Typography.Text>
          </div>
        )}
        {server.description && (
          <Typography.Paragraph 
            ellipsis={{ rows: 2 }} 
            style={{ marginBottom: 0 }}
            type="secondary"
          >
            {server.description}
          </Typography.Paragraph>
        )}
      </Card>
    </Col>
  );
  
  // Helper function to determine if the base64 string is valid
  const isValidBase64 = (str: string | null | undefined): boolean => {
    if (!str) return false;
    // Check if it's not an empty string and its length is valid
    return str.length > 0 && /^[A-Za-z0-9+/=]+$/.test(str);
  };

  return (
    <Card
      title={drawing.name}
      extra={
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
            Edit Drawing
          </Button>
          {onDelete && (
            <Popconfirm
              title="Delete Drawing"
              description="Are you sure you want to delete this drawing? This action cannot be undone."
              onConfirm={() => onDelete(drawing.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              disabled={isDeleting}
            >
              <Button danger icon={<DeleteOutlined />} loading={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </Popconfirm>
          )}
          <Button type="default" onClick={onClose}>
            Close
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: 20 }}>
        {/* Description */}
        {drawing.description && (
          <div style={{ marginBottom: 16 }}>
            <Typography.Paragraph>{drawing.description}</Typography.Paragraph>
          </div>
        )}
        
        {/* Servers Section in Collapsible Panel */}
        <Collapse 
          defaultActiveKey={[]} 
          style={{ marginBottom: 20 }}
          items={[
            {
              key: 'servers',
              label: (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CloudServerOutlined style={{ marginRight: 8 }} />
                  <span>Associated Servers</span>
                  {linkedServers && linkedServers.length > 0 && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {linkedServers.length}
                    </Tag>
                  )}
                </div>
              ),
              children: (
                <div>
                  {serversLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                      <Spin size="small" />
                      <span style={{ marginLeft: 10 }}>Loading servers...</span>
                    </div>
                  ) : linkedServers && linkedServers.length > 0 ? (
                    <>
                      {/* View toggle controls */}
                      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                        <Radio.Group 
                          value={viewType} 
                          onChange={(e) => setViewType(e.target.value)}
                          buttonStyle="solid"
                          size="small"
                        >
                          <Radio.Button value="list">
                            <UnorderedListOutlined /> List
                          </Radio.Button>
                          <Radio.Button value="grid">
                            <AppstoreOutlined /> Grid
                          </Radio.Button>
                          <Radio.Button value="table">
                            <TableOutlined /> Table
                          </Radio.Button>
                        </Radio.Group>
                      </div>
                      
                      {/* Server Display: List View */}
                      {viewType === 'list' && (
                        <List
                          itemLayout="horizontal"
                          dataSource={linkedServers}
                          renderItem={server => (
                            <List.Item
                              actions={[
                                <Link href={`/server/view/${server.id}`} key="server-link">
                                  <Button type="link" icon={<LinkOutlined />}>View</Button>
                                </Link>
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<CloudServerOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                                title={
                                  <Link href={`/server/view/${server.id}`}>
                                    <span style={{ color: '#1890ff', cursor: 'pointer' }}>{server.hostname}</span>
                                  </Link>
                                }
                                description={
                                  <Space direction="vertical" size="small">
                                    {server.ipv4 && (
                                      <div><Typography.Text type="secondary">IP: </Typography.Text>{server.ipv4}</div>
                                    )}
                                    {server.description && (
                                      <div>{server.description}</div>
                                    )}
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      )}
                      
                      {/* Server Display: Grid View */}
                      {viewType === 'grid' && (
                        <Row gutter={16}>
                          {linkedServers.map(server => renderGridItem(server))}
                        </Row>
                      )}
                      
                      {/* Server Display: Table View */}
                      {viewType === 'table' && (
                        <Table 
                          columns={columns} 
                          dataSource={linkedServers.map(s => ({ ...s, key: s.id }))} 
                          size="small"
                          pagination={false}
                        />
                      )}
                    </>
                  ) : (
                    <Empty 
                      description="No servers associated with this drawing" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    />
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
          background: '#f7f7f7',
          borderRadius: 4,
          minHeight: '60vh'
        }}
      >
        {isValidBase64(drawing.webp) ? (
          <img
            alt={drawing.name}
            src={`data:image/png;base64,${drawing.webp}`}
            style={{
              maxWidth: '100%',
              maxHeight: '60vh',
              objectFit: 'contain',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}
          />
        ) : (
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              background: '#f0f0f0',
              borderRadius: 4 
            }}
          >
            <Title level={4} style={{ color: '#bfbfbf' }}>No Preview Available</Title>
            <Typography.Paragraph type="secondary">
              Edit this drawing to generate a preview
            </Typography.Paragraph>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DrawingPreview;