'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Alert, Button, Card, Spin, Typography, Space } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDrawing, updateDrawingXML, updateDrawingWebp } from '@/app/actions/drawings/crudDrawings'
import DrawIOEmbed from '@/app/components/drawing/DrawIO'
import Link from 'next/link'

const { Title, Text } = Typography

const DiagramPage = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [initialXml, setInitialXml] = useState<string | null>(null)
  
  // Get drawing ID from URL
  const drawingId = searchParams.get('id') ? parseInt(searchParams.get('id')!, 10) : null
  
  // Fetch drawing data
  const { data: drawing, isLoading, error } = useQuery({
    queryKey: ['drawing', drawingId],
    queryFn: async () => {
      if (!drawingId) return null
      try {
        return await getDrawing(drawingId)
      } catch (err) {
        console.error('Error fetching drawing:', err)
        return null
      }
    },
    enabled: !!drawingId
  })
  
  // Set up mutations for saving drawing changes
  const xmlMutation = useMutation({
    mutationFn: async (xml: string) => {
      if (!drawingId) return null
      return await updateDrawingXML(drawingId, xml)
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['drawing', drawingId] })
    }
  })
  
  const webpMutation = useMutation({
    mutationFn: async (base64Data: string) => {
      if (!drawingId) return null
      return await updateDrawingWebp(drawingId, base64Data)
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['drawing', drawingId] })
    }
  })
  
  // Set initial XML when drawing data is loaded
  useEffect(() => {
    if (drawing?.xml) {
      setInitialXml(drawing.xml)
    }
  }, [drawing])
  
  // Handle loading XML into the editor
  const handleLoad = (): string => {
    if (initialXml) {
      return initialXml
    }
    return ''
  }
  
  // Handle saving XML from the editor
  const handleSave = (xml: string) => {
    if (drawingId) {
      xmlMutation.mutate(xml)
    }
  }
  
  // Handle exporting the diagram as an image
  const handleExport = (base64Data: string) => {
    if (drawingId) {
      webpMutation.mutate(base64Data)
    }
  }
  
  // Handle navigating back
  const handleBack = () => {
    router.back()
  }
  
  // If no drawing ID, show error
  if (!drawingId) {
    return (
      <Card>
        <Alert 
          message="Error" 
          description="No drawing ID provided. Please select a drawing to edit." 
          type="error" 
          showIcon
        />
        <div style={{ marginTop: 16 }}>
          <Button type="primary" onClick={handleBack}>
            Go Back
          </Button>
        </div>
      </Card>
    )
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 12 }}>Loading drawing editor...</div>
      </div>
    )
  }
  
  // Show error state
  if (error || !drawing) {
    return (
      <Card>
        <Alert 
          message="Error" 
          description="Failed to load the drawing. It may have been deleted or you don't have permission to access it." 
          type="error" 
          showIcon
        />
        <div style={{ marginTop: 16 }}>
          <Button type="primary" onClick={handleBack}>
            Go Back
          </Button>
        </div>
      </Card>
    )
  }
  
  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '20px' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              style={{ marginRight: 16 }}
            />
            <Title level={4} style={{ margin: 0 }}>
              {drawing.name}
            </Title>
          </div>
        }
        extra={
          <Space>
            <Text type="secondary">Changes are saved automatically</Text>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleBack}
            >
              Done Editing
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {drawing.description && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">{drawing.description}</Text>
          </div>
        )}
      </Card>
      
      <Card styles={{ body: { padding: 0 } }}>
        <DrawIOEmbed
          drawingId={drawingId}
          onLoad={handleLoad}
          onSave={handleSave}
          onExport={handleExport}
        />
      </Card>
    </div>
  )
}

export default DiagramPage
