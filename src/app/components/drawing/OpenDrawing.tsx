import React, { useState } from 'react'
import { Button, Drawer, Table, Radio, Empty, Row, Col, Card, Typography, Space } from "antd"
import { SelectDrawing } from '@/db/schema'
import { TableOutlined, AppstoreOutlined } from '@ant-design/icons'

const { Title } = Typography;

const OpenDrawing = ({ 
  children, 
  drawingsAvailable, 
  drawingSelected 
}: { 
  children: React.ReactNode, 
  drawingsAvailable: SelectDrawing[], 
  drawingSelected: (id: number) => void 
}) => {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const handleViewModeChange = (mode: 'table' | 'grid') => {
    setViewMode(mode);
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Drawer
        title="Drawings"
        width={800}
        open={open}
        onClose={() => setOpen(false)}
        footer={null}
        placement="left"
        extra={
          <Space>
            <Radio.Group 
              value={viewMode} 
              onChange={(e) => handleViewModeChange(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="table"><TableOutlined /> Table</Radio.Button>
              <Radio.Button value="grid"><AppstoreOutlined /> Grid</Radio.Button>
            </Radio.Group>
            <Button type="default" onClick={() => setOpen(false)}>Cancel</Button>
          </Space>
        }
        destroyOnClose
      >
        {drawingsAvailable && Array.isArray(drawingsAvailable) && (
          viewMode === 'table' ? (
            <Table
              columns={[
                {
                  title: "Title",
                  dataIndex: "name",
                  sorter: (a, b) => a.name.localeCompare(b.name),
                  defaultSortOrder: 'ascend',
                },
              ]}
              dataSource={drawingsAvailable.map((drawing) => ({
                id: drawing.id,
                name: drawing.name,
                key: drawing.id,
              }))}
              rowKey="id"
              size='small'
              onRow={(record) => ({
                onClick: () => { drawingSelected(record.id); setOpen(false) },
              })}
              rowClassName={() => 'cursor-pointer'}
            />
          ) : (
            drawingsAvailable.length > 0 ? (
              <Row gutter={[16, 16]}>
                {drawingsAvailable.map((drawing) => (
                  <Col key={drawing.id} xs={24} sm={12} md={8} lg={8} xl={6}>
                    <Card
                      hoverable
                      className="cursor-pointer"
                      onClick={() => { drawingSelected(drawing.id); setOpen(false) }}
                      cover={
                        drawing.webp ? (
                          <div style={{ 
                            height: 150, 
                            overflow: 'hidden', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            background: '#f5f5f5'
                          }}>
                            <img 
                              alt={drawing.name} 
                              src={`data:image/webp;base64,${drawing.webp}`} 
                              style={{ 
                                maxHeight: '100%',
                                maxWidth: '100%',
                                objectFit: 'contain'
                              }} 
                            />
                          </div>
                        ) : (
                          <div style={{ 
                            height: 150, 
                            background: '#f5f5f5', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center' 
                          }}>
                            <Title level={5} style={{ color: '#bfbfbf' }}>No Preview</Title>
                          </div>
                        )
                      }
                    >
                      <Card.Meta
                        title={drawing.name}
                        description={drawing.description || ""}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="No drawings available" />
            )
          )
        )}
      </Drawer>
    </>
  )
}

export default OpenDrawing