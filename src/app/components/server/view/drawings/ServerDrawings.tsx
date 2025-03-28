'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Card, Col, Empty, Modal, Radio, Row, Space, Spin, Table, Typography } from 'antd'
import { AppstoreOutlined, EditOutlined, LinkOutlined, TableOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { getServerDrawings } from '@/app/actions/drawings/serverDrawings/serverDrawingActions'
import type { ColumnsType } from 'antd/es/table'
import { SelectDrawing } from '@/db/schema'


const { Title, Text } = Typography

interface ServerDrawingsProps {
  serverId: number
}

const ServerDrawings: React.FC<ServerDrawingsProps> = ({ serverId }) => {
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid')
  const [previewDrawing, setPreviewDrawing] = useState<SelectDrawing | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)

  // Query to fetch drawings associated with this server
  const { data: drawings, isLoading, error } = useQuery({
    queryKey: ['server-drawings', serverId],
    queryFn: () => getServerDrawings(serverId),
    enabled: !!serverId
  })

  // Helper function to check if webp image is valid
  const isValidBase64 = (str: string | null | undefined): boolean => {
    if (!str) return false
    return str.length > 0 && /^[A-Za-z0-9+/=]+$/.test(str)
  }

  // Handle preview click
  const handlePreviewClick = (drawing: SelectDrawing) => {
    setPreviewDrawing(drawing)
    setPreviewVisible(true)
  }

  // Table column configuration
  const columns: ColumnsType<SelectDrawing> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <a onClick={() => handlePreviewClick(record)}>{record.name}</a>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<LinkOutlined />}
            onClick={() => handlePreviewClick(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ]

  // Render drawing in grid view
  const renderDrawingCard = (drawing: SelectDrawing) => (
    <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={6} key={drawing.id} style={{ marginBottom: 24 }}>
      <Card
        hoverable
        cover={
          drawing.webp && isValidBase64(drawing.webp) ? (
            <div 
              style={{ 
                height: 200, 
                overflow: 'hidden', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                background: '#f0f0f0',
                cursor: 'pointer'
              }}
              onClick={() => handlePreviewClick(drawing)}
            >
              <img
                alt={drawing.name}
                src={`data:image/png;base64,${drawing.webp}`}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div 
              style={{ 
                height: 200, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                background: '#f0f0f0',
                cursor: 'pointer'
              }}
              onClick={() => handlePreviewClick(drawing)}
            >
              <Text type="secondary">No Preview</Text>
            </div>
          )
        }
        actions={[
          <Button 
            type="link" 
            key="view" 
            icon={<LinkOutlined />}
            onClick={() => handlePreviewClick(drawing)}
          >
            View
          </Button>
        ]}
      >
        <Card.Meta
          title={<a onClick={() => handlePreviewClick(drawing)} title={drawing.name}>{drawing.name}</a>}
          description={
            <Typography.Paragraph ellipsis={{ rows: 2 }}>
              {drawing.description || 'No description'}
            </Typography.Paragraph>
          }
        />
      </Card>
    </Col>
  )

  const handleClose = () => {
    setPreviewVisible(false)
    setPreviewDrawing(null)
  }

  const handleEdit = () => {
    // Close the modal, editing will happen in a new page
    setPreviewVisible(false)
  }

  if (isLoading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 12 }}>Loading drawings...</div>
      </div>
    )
  }

  if (error) {
    return <Alert message="Error loading drawings" type="error" />
  }

  const hasDrawings = drawings && drawings.length > 0

  return (
    <div style={{ padding: '0 20px 20px 20px', maxWidth: '100%', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4}>Linked Drawings</Title>
        <Radio.Group
          value={viewType}
          onChange={(e) => setViewType(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="grid"><AppstoreOutlined /> Grid</Radio.Button>
          <Radio.Button value="table"><TableOutlined /> Table</Radio.Button>
        </Radio.Group>
      </div>

      {!hasDrawings ? (
        <Empty description="No drawings linked to this server" />
      ) : viewType === 'grid' ? (
        <Row gutter={[24, 24]}>
          {drawings.map(drawing => renderDrawingCard(drawing))}
        </Row>
      ) : (
        <Table
          columns={columns}
          dataSource={drawings.map(d => ({ ...d, key: d.id }))}
          pagination={false}
          rowKey="id"
          size="small"
        />
      )}

      <Modal
        title={previewDrawing?.name || 'Drawing Preview'}
        open={previewVisible}
        onCancel={handleClose}
        width={1000}
        footer={[
          <Button key="close" onClick={handleClose}>
            Close
          </Button>,
          <Link 
            href={previewDrawing ? `/diagram?id=${previewDrawing.id}` : '#'} 
            key="edit" 
            onClick={handleEdit}
          >
            <Button type="primary" icon={<EditOutlined />}>
              Edit in DrawIO
            </Button>
          </Link>
        ]}
      >
        {previewDrawing && (
          <div style={{ height: '70vh', overflow: 'auto' }}>
            {previewDrawing.webp && isValidBase64(previewDrawing.webp) ? (
              <img
                alt={previewDrawing.name}
                src={`data:image/png;base64,${previewDrawing.webp}`}
                style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }}
              />
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                background: '#f0f0f0'
              }}>
                <Text type="secondary">No Preview Available</Text>
              </div>
            )}
            
            {previewDrawing.description && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Description</Title>
                <Typography.Paragraph>{previewDrawing.description}</Typography.Paragraph>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ServerDrawings
