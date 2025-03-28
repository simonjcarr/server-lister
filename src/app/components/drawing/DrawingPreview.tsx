import React from 'react';
import { Button, Card, Empty, Space, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { SelectDrawing } from '@/db/schema';

const { Title } = Typography;

interface DrawingPreviewProps {
  drawing: SelectDrawing | null;
  onEdit: () => void;
  onClose: () => void;
}

const DrawingPreview: React.FC<DrawingPreviewProps> = ({ drawing, onEdit, onClose }) => {
  if (!drawing) {
    return <Empty description="No drawing selected" />;
  }

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
          <Button type="default" onClick={onClose}>
            Close
          </Button>
        </Space>
      }
    >
      {drawing.description && (
        <div style={{ marginBottom: 16 }}>
          <Typography.Paragraph>{drawing.description}</Typography.Paragraph>
        </div>
      )}

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