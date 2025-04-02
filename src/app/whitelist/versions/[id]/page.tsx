'use client';

import { useParams } from 'next/navigation';
import type { ColumnsType } from 'antd/es/table';

import { useState } from 'react';
import { Card, Table, Button, Typography, Space, Tag, Spin, Modal, Form, Input, DatePicker, Switch, message } from 'antd';
import { useRouter } from 'next/navigation';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import { 
  fetchSoftwareWhitelistItem, 
  fetchVersionsForSoftware,
  createSoftwareVersion,
  updateSoftwareVersion,
  deleteSoftwareVersion
} from '@/app/actions/whitelist/whitelistActions';
import { InsertSoftwareWhitelistVersion, SelectSoftwareWhitelistVersion } from '@/db/schema/softwareWhitelist';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function VersionsPage() {
  const params = useParams<{id: string}>();
  const softwareId = parseInt(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<SelectSoftwareWhitelistVersion | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // Query to fetch software details
  const { data: software, isLoading: loadingSoftware } = useQuery({
    queryKey: ['softwareWhitelist', softwareId],
    queryFn: () => fetchSoftwareWhitelistItem(softwareId),
    enabled: !isNaN(softwareId),
  });

  // Query to fetch versions
  const { data: versions, isLoading: loadingVersions } = useQuery({
    queryKey: ['softwareVersions', softwareId],
    queryFn: () => fetchVersionsForSoftware(softwareId),
    enabled: !isNaN(softwareId),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSoftwareVersion,
    onSuccess: () => {
      messageApi.success('Version added successfully');
      queryClient.invalidateQueries({ queryKey: ['softwareVersions', softwareId] });
      setAddModalVisible(false);
      form.resetFields();
    },
    onError: (error) => {
      messageApi.error('Failed to add version');
      console.error('Error:', error);
    }
  });

  const updateMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, data }: { id: number, data: Record<string, any> }) => updateSoftwareVersion(id, data),
    onSuccess: () => {
      messageApi.success('Version updated successfully');
      queryClient.invalidateQueries({ queryKey: ['softwareVersions', softwareId] });
      setEditModalVisible(false);
    },
    onError: (error) => {
      messageApi.error('Failed to update version');
      console.error('Error:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSoftwareVersion,
    onSuccess: () => {
      messageApi.success('Version deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['softwareVersions', softwareId] });
    },
    onError: (error) => {
      messageApi.error('Failed to delete version');
      console.error('Error:', error);
    }
  });

  // Handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddVersion = (values: Record<string, any>) => {
    const data: InsertSoftwareWhitelistVersion = {
      softwareWhitelistId: softwareId,
      versionPattern: values.versionPattern,
      description: values.description,
      releaseDate: values.releaseDate ? values.releaseDate.toDate() : null,
      isApproved: values.isApproved,
    };
    createMutation.mutate(data);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditVersion = (values: Record<string, any>) => {
    if (!currentVersion) return;
    
    const data = {
      versionPattern: values.versionPattern,
      description: values.description,
      releaseDate: values.releaseDate ? values.releaseDate.toDate() : null,
      isApproved: values.isApproved,
    };
    
    updateMutation.mutate({ id: currentVersion.id, data });
  };

  const showEditModal = (version: SelectSoftwareWhitelistVersion) => {
    setCurrentVersion(version);
    editForm.setFieldsValue({
      ...version,
      releaseDate: version.releaseDate ? dayjs(version.releaseDate) : null,
    });
    setEditModalVisible(true);
  };

  const confirmDelete = (id: number) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this version?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        deleteMutation.mutate(id);
      }
    });
  };

  // Table columns
  const columns: ColumnsType<SelectSoftwareWhitelistVersion> = [
    {
      title: 'Version Pattern',
      dataIndex: 'versionPattern',
      key: 'versionPattern',
      sorter: (a: SelectSoftwareWhitelistVersion, b: SelectSoftwareWhitelistVersion) => 
        a.versionPattern.localeCompare(b.versionPattern),
    },
    {
      title: 'Release Date',
      dataIndex: 'releaseDate',
      key: 'releaseDate',
      render: (date: Date | null) => date ? dayjs(date).format('YYYY-MM-DD') : 'N/A',
      sorter: (a: SelectSoftwareWhitelistVersion, b: SelectSoftwareWhitelistVersion) => {
        if (!a.releaseDate) return -1;
        if (!b.releaseDate) return 1;
        return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
      },
    },
    {
      title: 'Status',
      dataIndex: 'isApproved',
      key: 'isApproved',
      render: (approved: boolean) => (
        <Tag color={approved ? 'green' : 'red'}>
          {approved ? 'Approved' : 'Not Approved'}
        </Tag>
      ),
      filters: [
        { text: 'Approved', value: true },
        { text: 'Not Approved', value: false },
      ],
      onFilter: (value, record) => record.isApproved === value,
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
      render: (_: unknown, record: SelectSoftwareWhitelistVersion) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => confirmDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  if (loadingSoftware || loadingVersions) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center p-8">
          <Spin tip="Loading..." />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      {contextHolder}
      <div className="space-y-6">
        <Card>
          <div className="flex justify-between items-center mb-4">
            <div>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => router.push('/whitelist')}
                className="mr-2"
              >
                Back to Whitelist
              </Button>
              <Title level={4} className="inline-block ml-2">
                {software?.name} Versions
              </Title>
              {software?.osFamilyId && (
                <Tag color={software.osFamilyId === 1 ? 'blue' : 'green'} className="ml-2">
                  {software.osFamilyId === 1 ? 'Windows' : 'Linux'}
                </Tag>
              )}
            </div>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
            >
              Add Version
            </Button>
          </div>
          
          {software?.description && (
            <div className="mb-4">
              <Text type="secondary">{software.description}</Text>
            </div>
          )}
          
          <Table 
            rowKey="id"
            dataSource={versions || []}
            columns={columns}
            pagination={{ defaultPageSize: 10 }}
          />
        </Card>

        {/* Add Version Modal */}
        <Modal
          title="Add Version"
          open={addModalVisible}
          onCancel={() => setAddModalVisible(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddVersion}
            initialValues={{ isApproved: true }}
          >
            <Form.Item
              name="versionPattern"
              label="Version Pattern"
              rules={[{ required: true, message: 'Please enter version pattern' }]}
            >
              <Input placeholder="e.g., 1.2.3, 1.2.*, >2.0.0" />
            </Form.Item>
            
            <Form.Item
              name="releaseDate"
              label="Release Date"
            >
              <DatePicker />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea rows={3} />
            </Form.Item>
            
            <Form.Item
              name="isApproved"
              label="Approved"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item className="mb-0">
              <div className="flex justify-end space-x-2">
                <Button onClick={() => setAddModalVisible(false)}>
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={createMutation.isPending}
                >
                  Add Version
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Version Modal */}
        <Modal
          title="Edit Version"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditVersion}
          >
            <Form.Item
              name="versionPattern"
              label="Version Pattern"
              rules={[{ required: true, message: 'Please enter version pattern' }]}
            >
              <Input placeholder="e.g., 1.2.3, 1.2.*, >2.0.0" />
            </Form.Item>
            
            <Form.Item
              name="releaseDate"
              label="Release Date"
            >
              <DatePicker />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea rows={3} />
            </Form.Item>
            
            <Form.Item
              name="isApproved"
              label="Approved"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item className="mb-0">
              <div className="flex justify-end space-x-2">
                <Button onClick={() => setEditModalVisible(false)}>
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={updateMutation.isPending}
                >
                  Update Version
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
