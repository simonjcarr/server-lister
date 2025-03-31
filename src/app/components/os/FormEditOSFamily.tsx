'use client'
import { getOSFamilyById, updateOSFamily } from '@/app/actions/os/osFamilyActions';
import { UpdateOSFamily } from '@/db/schema';
import { Card, Form, Input, Button, notification, Drawer, Spin } from 'antd'
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
const { TextArea } = Input;
// Removed unused Text import

function FormEditOSFamily({id, children}: {id: number, children: React.ReactNode}) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = notification.useNotification();
  const queryClient = useQueryClient();

  // Fetch OS Family data
  const { data: osFamily, isLoading, error, refetch } = useQuery({
    queryKey: ['osFamily', id],
    queryFn: () => getOSFamilyById(id),
    enabled: open, // Only fetch when drawer is open
  });

  // Set form values when data is loaded
  useEffect(() => {
    if (osFamily) {
      form.setFieldsValue({
        name: osFamily.name,
        description: osFamily.description,
      });
    }
  }, [osFamily, form]);

  // Handle form submission
  async function onFinish(values: UpdateOSFamily) {
    try {
      setLoading(true);
      // Submit to server action
      const result = await updateOSFamily(id, values);

      if (result.success) {
        messageApi.success({
          message: "Updated",
          description: "OS Family has been updated successfully",
          duration: 3,
        });
        refetch(); // Refresh data
        
        // Invalidate all OS family related queries with different patterns that might be used
        queryClient.invalidateQueries({ queryKey: ['osFamilies'] });
        queryClient.invalidateQueries({ queryKey: ['osFamilyWithCount'] });
        
        // Also invalidate OS queries since they may display family names
        queryClient.invalidateQueries({ queryKey: ['oss'] });
        queryClient.invalidateQueries({ queryKey: ['os'] });
        
        setOpen(false);
      } else {
        messageApi.error({
          message: "Failed",
          description: "Failed to update OS Family",
          duration: 3,
        });
      }
    } catch (error) {
      console.error("Error updating OS Family:", error);
      messageApi.error({
        message: "Failed",
        description: "An unexpected error occurred while updating the OS Family",
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <span onClick={() => setOpen(true)}>{children}</span>
    <Drawer title="Edit OS Family" open={open} onClose={() => setOpen(false)} width={400} placement="right" destroyOnClose>
    <Card
      title="Edit OS Family"
      className="dark:bg-gray-800 dark:border-gray-700"
    >
      {contextHolder}
      {isLoading ? (
        <div className="flex justify-center my-8">
          <Spin size="large" />
        </div>
      ) : error ? (
        <div className="text-red-500 my-4">Error loading OS Family data</div>
      ) : (
        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
          className="dark:text-white"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[
              {
                required: true,
                message: "Please enter an OS Family name",
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
            <Button type="primary" htmlType="submit" loading={loading}>Update OS Family</Button>
          </Form.Item>
        </Form>
      )}
    </Card>
    </Drawer>
    </>
  )
}

export default FormEditOSFamily