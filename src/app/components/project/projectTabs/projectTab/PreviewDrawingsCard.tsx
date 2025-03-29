import React from 'react'
import { useQuery } from "@tanstack/react-query"
import { getProjectDrawings } from "@/app/actions/projects/crudActions"
import { Button, Card, Typography } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'

/**
 * Component for displaying technology stacks from project drawings
 */
const PreviewDrawingsCard = ({ projectId }: { projectId: number }) => {
  // Fetch drawings data from the server
  const { data: drawings = [], isLoading } = useQuery({
    queryKey: ["project-drawings", projectId],
    queryFn: () => getProjectDrawings(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000
  })

  /**
   * Handle clicking on a drawing to open it in the Drawings tab
   */
  const handleDrawingClick = (drawingId: number) => {
    // First, find the Drawings tab and click it
    const tabsElement = document.querySelector('.ant-tabs-nav .ant-tabs-tab:nth-child(3)');
    if (tabsElement) {
      (tabsElement as HTMLElement).click();
      
      // After a small delay to allow tab switch, find the drawing in the list and click it
      setTimeout(() => {
        // Create and dispatch a custom event to open the drawing
        const event = new CustomEvent('openDrawing', { detail: { drawingId } });
        document.dispatchEvent(event);
      }, 100);
    }
  }

  // We don't need to validate the base64 string as it should be valid if present

  return (
    <Card title="Project Drawings" className="h-full">
      {isLoading ? (
        <div className="text-center py-4">Loading drawings...</div>
      ) : drawings.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No drawings available for this project</div>
      ) : (
        <div className="space-y-4">
          {drawings.map((drawing) => (
            <Card 
              key={drawing.id} 
              hoverable
              className="overflow-hidden flex flex-col"
              onClick={() => handleDrawingClick(drawing.id)}
            >
              <Typography.Title level={5} className="mb-0 truncate">{drawing.name}</Typography.Title>
              
              <div className="h-36 flex items-center justify-center bg-gray-100 mt-4 mb-6 overflow-hidden">
                {drawing.webp ? (
                  <img
                    alt={drawing.name}
                    src={`data:image/png;base64,${drawing.webp}`}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Typography.Text className="text-gray-400 text-center">
                    No preview
                  </Typography.Text>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="text" 
                  className="p-0 h-auto flex items-center gap-1"
                >
                  <span>Open</span>
                  <ArrowRightOutlined />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  )
}

export default PreviewDrawingsCard