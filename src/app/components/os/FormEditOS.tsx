'use client'
import React, { useState } from 'react';
import { Card, Form, Input, Button, notification, Typography, Drawer, Spin, Select } from 'antd'; // Added Select
const { TextArea } = Input;
const { Text } = Typography;
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOSById, updateOS } from '@/app/actions/os/crudActions';
import { getOSFamilies } from '@/app/actions/os/osFamilyActions';
import { UpdateOS, SelectOS } from '@/db/schema'; // Added SelectOS
import ManageOSPatchVersions from './ManageOSPatchVersions'; // Import the new component

const FormEditOS = ({ children, id }: { children: React.ReactNode, id: number }) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false); // Consider removing if only updateLoading is used
  const [messageApi, contextHolder] = notification.useNotification();
  const queryClient = useQueryClient();

  // Fetch OS data
  const { data: os, isLoading, isFetching } = useQuery<SelectOS, Error>({ // Specify types
    queryKey: ['os', id],
    queryFn: () => getOSById(id, Date.now()), // Add timestamp to bust cache
    enabled: open, // Only fetch when drawer is open
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: false, // Don't refetch on window focus
    gcTime: 0, // Disable garbage collection (equivalent to old cacheTime),
  });

  // Fetch OS Families for dropdown
  const { data: osFamilies = [] } = useQuery({
    queryKey: ['osFamilies'],
    queryFn: getOSFamilies,
    enabled: open, // Only fetch when drawer is open
  });

  // Update OS mutation
  const { mutate: updateOSMutation, isPending: updateLoading } = useMutation({
    mutationFn: (data: UpdateOS) => updateOS(id, data),
    onSuccess: () => {
      messageApi.success({
        message: "Updated",
        description: "OS has been updated successfully",
        duration: 3,
      });
      
      
      // Force refetch all related queries
      console.log('Mutation successful - refetching queries');
      
      // Then refetch
      queryClient.refetchQueries({ queryKey: ['oss'] });
      queryClient.refetchQueries({ queryKey: ['os', id] });
      queryClient.refetchQueries({ queryKey: ['os'] });
      setOpen(false);
    },
    onError: (error) => {
      console.error("Error updating OS:", error);
      messageApi.error({
        message: "Failed",
        description: "Failed to update OS",
        duration: 3,
      });
    },
  });

  // Handle form submission
  const onFinish = async (values: UpdateOS) => {
    try {
      setLoading(true);
      console.log("values", values)
      updateOSMutation({
        ...values,
        EOLDate: values.EOLDate ? new Date(values.EOLDate) : undefined,
      });
    } catch (error) {
      console.error("Error updating OS:", error);
      messageApi.error({
        message: "Failed",
        description: "An unexpected error occurred while updating the OS",
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <>
    {contextHolder}
    <span onClick={() => setOpen(true)}>{children}</span>
    <Drawer
      title="Edit OS"
      open={open}
      onClose={() => setOpen(false)}
      width={400}
      placement="right"
      destroyOnClose={true} // Make sure drawer fully destroys content when closed
    >
      {(isLoading || isFetching) ? (
        <div className="flex justify-center items-center h-full">
          <Spin size="large"  />
        </div>
      ) : os ? (
        <Card
          title="Edit OS"
          extra={<Text type="secondary" className="dark:text-gray-300">Edit server OS</Text>}
          className="dark:bg-gray-800 dark:border-gray-700"
        >
          <Form
            form={form}
            initialValues={{...os, EOLDate: os.EOLDate ? new Date(os.EOLDate).toISOString().split('T')[0] : ''}}
            layout="vertical"
            onFinish={onFinish}
            className="dark:text-white"
            key={`os-form-${id}-${os ? String(new Date(os.updatedAt).getTime()) : 'new'}`} // Fix TS error with conditional check
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[
                {
                  required: true,
                  message: "Please enter an OS name",
                },
                {
                  min: 2,
                  message: "Name must be at least 2 characters",
                },
                {
                  max: 100,
                  message: "Name must not exceed 100 characters",
                },
              ]}
              className="dark:text-white"
            >
              <Input className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </Form.Item>
            <Form.Item
              name="version"
              label="Version"
              rules={[
                {
                  required: true,
                  message: "Please enter an OS version",
                },
              ]}
              className="dark:text-white"
            >
              <Input className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </Form.Item>

            <Form.Item
              name="osFamilyId"
              label="OS Family"
              className="dark:text-white"
            >
              <Select
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="Select OS Family"
                allowClear
                options={osFamilies.map(family => ({
                  label: family.name,
                  value: family.id
                }))}
              />
            </Form.Item>

            <Form.Item
              name="EOLDate"
              label="End of Life Date"
              rules={[
                {
                  required: true,
                  message: "Please enter an EOL date",
                },
              ]}
              className="dark:text-white"
            >
              <Input type="date" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[
                {
                  max: 500,
                  message: "Description must not exceed 500 characters",
                },
              ]}
              className="dark:text-white"
            >
              <TextArea className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading || updateLoading}>
                Update
              </Button>
            </Form.Item>
          </Form>
          {/* Add the ManageOSPatchVersions component here */}
          <ManageOSPatchVersions osId={id} />
        </Card>
      ) : (
        <div className="text-center text-red-500">
          Failed to load OS data. Please try again.
        </div>
      )}
    </Drawer>
    </>
  );
}

export default FormEditOS
