'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button, Card, Typography, Input, Modal, List, Skeleton, App, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useServerBuildDocs, useCreateBuildDoc, useDeleteBuildDoc } from '@/app/actions/buildDocs/clientActions';

const { Title, Text } = Typography;

export default function BuildDocsPage() {
  const { serverId } = useParams<{ serverId: string }>();
  const serverIdNum = parseInt(serverId as string, 10);
  const router = useRouter();
  const { data: session } = useSession();
  const { message } = App.useApp();
  
  // State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  
  // Queries
  const { data: buildDocsData, isLoading, refetch } = useServerBuildDocs(serverIdNum);
  
  // Mutations
  const { mutate: createBuildDoc, isPending: isCreating } = useCreateBuildDoc();
  const { mutate: deleteBuildDoc, isPending: isDeleting } = useDeleteBuildDoc();
  
  const buildDocs = buildDocsData?.success ? buildDocsData.data : [];
  
  // Create a new build doc
  const handleCreateDoc = () => {
    if (!session?.user?.id) return;
    
    createBuildDoc({
      title: newDocTitle,
      serverId: serverIdNum,
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
  
  // View a build doc
  const handleViewDoc = (doc: { id: number }) => {
    router.push(`/server/view/${serverIdNum}/build-docs/${doc.id}`);
  };
  
  // Delete a build doc
  const handleDeleteDoc = (doc: { id: number }) => {
    if (!session?.user?.id) return;
    
    deleteBuildDoc({ id: doc.id, serverId: serverIdNum }, {
      onSuccess: () => {
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
  
  return (
    <div className="p-4">
      <Card
        title={<Title level={4}>Build Documentation</Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>New Documentation</Button>}
      >
        {(buildDocsData?.data || []).length === 0 ? (
          <div className="text-center py-8">
            <Text>No build documentation yet. Create your first documentation to get started.</Text>
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={buildDocs}
            renderItem={(doc) => (
              <List.Item
                actions={[
                  <Button key="edit" icon={<EditOutlined />} onClick={() => handleViewDoc(doc)}>View</Button>,
                  <Popconfirm
                    key="delete"
                    title="Delete this build documentation?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDeleteDoc(doc)}
                    okText="Yes, Delete"
                    cancelText="Cancel"
                  >
                    <Button danger icon={<DeleteOutlined />} loading={isDeleting}>Delete</Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={<a onClick={() => handleViewDoc(doc)}>{doc.title}</a>}
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
