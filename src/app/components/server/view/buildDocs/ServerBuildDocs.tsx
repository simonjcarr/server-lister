'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Card, Typography, Input, Modal, List, Skeleton, App, Popconfirm, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { 
  useServerBuildDocs, 
  useCreateBuildDoc, 
  useDeleteBuildDoc 
} from '@/app/actions/buildDocs/clientActions';
import ServerBuildDocViewer from './ServerBuildDocViewer';

const { Title } = Typography;

interface ServerBuildDocsProps {
  serverId: number;
}

export default function ServerBuildDocs({ serverId }: ServerBuildDocsProps) {
  const { data: session } = useSession();
  const { message } = App.useApp();
  
  // State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  
  // Queries
  const { data: buildDocsData, isLoading, refetch } = useServerBuildDocs(serverId);
  
  // Mutations
  const { mutate: createBuildDoc, isPending: isCreating } = useCreateBuildDoc();
  const { mutate: deleteBuildDoc, isPending: isDeleting } = useDeleteBuildDoc();
  
  const buildDocs = buildDocsData?.success ? buildDocsData.data : [];
  
  // Create a new build doc
  const handleCreateDoc = () => {
    if (!session?.user?.id) return;
    
    createBuildDoc({
      title: newDocTitle,
      serverId: serverId,
      userId: session.user.id
    }, {
      onSuccess: () => {
        setIsModalVisible(false);
        setNewDocTitle('');
        refetch();
        message.success('Build documentation created successfully');
      }
    });
  };
  
  // Select a build doc to view
  const handleSelectDoc = (docId: number) => {
    setSelectedDocId(docId);
  };
  
  // Delete a build doc
  const handleDeleteDoc = (docId: number) => {
    if (!session?.user?.id) return;
    
    deleteBuildDoc({ id: docId, serverId: serverId }, {
      onSuccess: () => {
        if (selectedDocId === docId) {
          setSelectedDocId(null);
        }
        refetch();
        message.success('Build documentation deleted successfully');
      }
    });
  };
  
  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton active />
      </div>
    );
  }

  // If a doc is selected, show the doc viewer
  if (selectedDocId) {
    return (
      <div className="p-4">
        <div className="mb-4">
          <Button onClick={() => setSelectedDocId(null)}>
            Back to Build Documents
          </Button>
        </div>
        <ServerBuildDocViewer buildDocId={selectedDocId} serverId={serverId} />
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <Card
        title={<Title level={4}>Build Documentation</Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>New Documentation</Button>}
      >
        {(buildDocsData?.data || []).length === 0 ? (
          <Empty
            description="No build documentation yet. Create your first documentation to get started."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={buildDocs}
            renderItem={(doc) => (
              <List.Item
                actions={[
                  <Button key="view" icon={<EditOutlined />} onClick={() => handleSelectDoc(doc.id)}>View</Button>,
                  <Popconfirm
                    key="delete"
                    title="Delete this build documentation?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDeleteDoc(doc.id)}
                    okText="Yes, Delete"
                    cancelText="Cancel"
                  >
                    <Button danger icon={<DeleteOutlined />} loading={isDeleting}>Delete</Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={<a onClick={() => handleSelectDoc(doc.id)}>{doc.title}</a>}
                  description={`Created: ${new Date(doc.createdAt).toLocaleDateString()} | Last Updated: ${new Date(doc.updatedAt).toLocaleDateString()}`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
      
      <Modal
        title="Create New Build Documentation"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setNewDocTitle('');
        }}
        onOk={handleCreateDoc}
        okText="Create"
        confirmLoading={isCreating}
      >
        <div className="py-4">
          <Input 
            placeholder="Build Documentation Title" 
            value={newDocTitle} 
            onChange={(e) => setNewDocTitle(e.target.value)} 
            onPressEnter={handleCreateDoc}
          />
        </div>
      </Modal>
    </div>
  );
}