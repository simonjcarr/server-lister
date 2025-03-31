import React, { useState } from 'react'
import { useQuery } from "@tanstack/react-query"
import { getProjectDrawings } from "@/app/actions/projects/crudActions"
import { Button, Card, Typography, Radio, Table, Row, Col } from 'antd'
import { ArrowRightOutlined, TableOutlined, AppstoreOutlined } from '@ant-design/icons'
import Image from 'next/image'

/**
 * Component for displaying technology stacks from project drawings
 */
const PreviewDrawingsCard = ({ projectId }: { projectId: number }) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  
  // Fetch drawings data from the server
  const { data: drawings = [], isLoading } = useQuery({
    queryKey: ["project-drawings", projectId],
    queryFn: () => getProjectDrawings(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000
  })

  /**
   * Handle clicking on a drawing to open it in the Drawings tab
   * This matches the behavior in OpenDrawing.tsx where drawingSelected is called
   */
  const handleDrawingClick = (drawingId: number) => {
    // First, find the Drawings tab and click it
    const tabsElement = document.querySelector('.ant-tabs-nav .ant-tabs-tab:nth-child(3)');
    if (tabsElement) {
      (tabsElement as HTMLElement).click();
      
      // After a small delay to allow tab switch, dispatch the custom event to open the drawing
      // This event is listened for in DrawingsComponent.tsx with the same handler that OpenDrawing.tsx uses
      setTimeout(() => {
        // Create and dispatch a custom event to open the drawing
        const event = new CustomEvent('openDrawing', { detail: { drawingId } });
        document.dispatchEvent(event);
      }, 100);
    }
  }

  // We don't need to validate the base64 string as it should be valid if present

  return (
    <Card 
      title="Project Drawings" 
      className="h-full"
      extra={
        <Radio.Group 
          value={viewMode} 
          onChange={(e) => setViewMode(e.target.value)}
          optionType="button"
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="table"><TableOutlined /> Table</Radio.Button>
          <Radio.Button value="grid"><AppstoreOutlined /> Grid</Radio.Button>
        </Radio.Group>
      }
    >
      {isLoading ? (
        <div className="text-center py-4">Loading drawings...</div>
      ) : drawings.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No drawings available for this project</div>
      ) : viewMode === 'table' ? (
        <Table
          columns={[
            {
              title: "Title",
              dataIndex: "name",
              sorter: (a, b) => a.name.localeCompare(b.name),
              defaultSortOrder: 'ascend',
            },
            {
              title: "Actions",
              key: "actions",
              width: 100,
              render: (_, record) => (
                <Button 
                  type="text" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDrawingClick(record.id);
                  }} 
                  className="flex items-center gap-1"
                >
                  <span>Open</span>
                  <ArrowRightOutlined />
                </Button>
              )
            }
          ]}
          dataSource={drawings.map((drawing) => ({
            id: drawing.id,
            name: drawing.name,
            key: drawing.id,
          }))}
          rowKey="id"
          size='small'
          onRow={(record) => ({
            onClick: () => handleDrawingClick(record.id),
          })}
          rowClassName={() => 'cursor-pointer'}
          pagination={false}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {drawings.map((drawing) => (
            <Col key={drawing.id} xs={24} sm={12} md={8} lg={8} xl={8}>
              <Card 
                hoverable
                className="overflow-hidden flex flex-col h-full"
                onClick={() => handleDrawingClick(drawing.id)}
              >
                <Typography.Title level={5} className="mb-0 truncate">{drawing.name}</Typography.Title>
                
                <div className="h-36 flex items-center justify-center bg-gray-100 mt-4 mb-6 overflow-hidden">
                  {drawing.webp ? (
                    <Image
                      alt={drawing.name}
                      src={`data:image/webp;base64,${drawing.webp}`}
                      className="max-h-full max-w-full object-contain"
                      width={300}
                      height={150}
                    />
                  ) : (
                    <Typography.Text className="text-gray-400 text-center">
                      No preview
                    </Typography.Text>
                  )}
                </div>
                
                <div className="flex justify-end mt-auto">
                  <Button 
                    type="text" 
                    className="p-0 h-auto flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ArrowRightOutlined />
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Card>
  )
}

export default PreviewDrawingsCard