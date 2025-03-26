'use client'
import React, { useState } from 'react';
import { List, Button, Modal, Form, Input, DatePicker, Popconfirm, notification, Spin, Typography, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOSPatchVersionsByOSId, addOSPatchVersion, deleteOSPatchVersion } from '@/app/actions/os/crudOSPatchVersionActions';
import { InsertOSPatchVersion, SelectOSPatchVersion } from '@/db/schema';
import dayjs from 'dayjs'; // Import dayjs for date handling

const { Text, Title } = Typography;

interface ManageOSPatchVersionsProps {
  osId: number;
}

const ManageOSPatchVersions: React.FC<ManageOSPatchVersionsProps> = ({ osId }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = notification.useNotification();

  // Fetch patch versions
  const { data: patchVersions, isLoading, isFetching, error } = useQuery<SelectOSPatchVersion[], Error>({
    queryKey: ['osPatchVersions', osId],
    queryFn: () => getOSPatchVersionsByOSId(osId),
    enabled: !!osId, // Only run query if osId is valid
  });

  // Add mutation
  const { mutate: addMutate, isPending: isAdding } = useMutation({
    mutationFn: addOSPatchVersion,
    onSuccess: () => {
      messageApi.success({ message: 'Patch version added successfully' });
      queryClient.invalidateQueries({ queryKey: ['osPatchVersions', osId] });
      setIsModalVisible(false);
      form.resetFields();
    },
    onError: (err: Error) => {
      messageApi.error({ message: 'Failed to add patch version', description: err.message });
    },
  });

  // Delete mutation
  const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
    mutationFn: deleteOSPatchVersion,
    onSuccess: () => {
      messageApi.success({ message: 'Patch version deleted successfully' });
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['osPatchVersions', osId] });
    },
    onError: (err: Error) => {
      messageApi.error({ message: 'Failed to delete patch version', description: err.message });
    },
  });

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleAdd = (values: { version: string; releaseDate: dayjs.Dayjs }) => {
    // Use patchVersion to match the schema type
    const newPatchVersion: InsertOSPatchVersion = {
      osId: osId,
      patchVersion: values.version, // Changed from patch_version to patchVersion
      releaseDate: values.releaseDate.toDate(), // Convert dayjs object to Date
      createdAt: new Date(), // Add current date for createdAt
      updatedAt: new Date(), // Add current date for updatedAt
    };
    addMutate(newPatchVersion);
  };

  const handleDelete = (id: number) => {
    deleteMutate(id);
  };

  if (isLoading || isFetching) {
    return <div className="flex justify-center items-center p-4"><Spin /></div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading patch versions: {error.message}</div>;
  }

  return (
    <div className="mt-6">
      {contextHolder}
      <Divider />
      <Title level={5} className="dark:text-white mb-4">Manage Patch Versions</Title>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={showModal}
        className="mb-4"
      >
        Add Patch Version
      </Button>

      <List
        className="dark:bg-gray-800 dark:border-gray-700 rounded"
        bordered
        dataSource={patchVersions}
        renderItem={(item) => (
          <List.Item
            className="dark:text-gray-300 dark:border-gray-700"
            actions={[
              <Popconfirm
                key={`delete-${item.id}`}
                title="Are you sure delete this patch version?"
                onConfirm={() => handleDelete(item.id)}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ loading: isDeleting }}
              >
                <Button type="link" danger icon={<DeleteOutlined />} loading={isDeleting} />
              </Popconfirm>
            ]}
          >
            <List.Item.Meta
              // Use patchVersion to match the schema property
              title={<Text className="dark:text-white">{item.patchVersion}</Text>}
              description={<Text type="secondary" className="dark:text-gray-400">Released: {new Date(item.releaseDate).toLocaleDateString()}</Text>}
            />
          </List.Item>
        )}
        locale={{ emptyText: <div className="text-center p-4 dark:text-gray-400">No patch versions found.</div> }}
      />

      <Modal
        title="Add New Patch Version"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null} // Use Form's button
        destroyOnClose // Reset form state when modal is closed
        className="dark:bg-gray-800" // Apply dark mode styles if needed
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAdd}
          className="dark:text-white"
        >
          <Form.Item
            name="version"
            label="Version"
            rules={[{ required: true, message: 'Please input the version number!' }]}
          >
            <Input className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
          </Form.Item>
          <Form.Item
            name="releaseDate"
            label="Release Date"
            rules={[{ required: true, message: 'Please select the release date!' }]}
          >
            {/* Use DatePicker with dayjs */}
            <DatePicker format="YYYY-MM-DD" className="dark:bg-gray-700 dark:text-white dark:border-gray-600 [&>div>input]:!text-white" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isAdding}>
              Add Version
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={handleCancel}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageOSPatchVersions;
