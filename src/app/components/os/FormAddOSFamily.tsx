'use client'
import { addOSFamily } from '@/app/actions/os/osFamilyActions';
import { InsertOSFamily } from '@/db/schema';
import { Card, Form, Input, Button, notification, Typography, Drawer } from 'antd'
import { useState } from 'react';
const { TextArea } = Input;
const { Text } = Typography;

function FormAddOSFamily({children}: {children: React.ReactNode}) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = notification.useNotification();

  // Handle form submission
  async function onFinish(values: InsertOSFamily) {
    try {
      setLoading(true);
      // Submit to server action
      const result = await addOSFamily(values);

      if (result.success) {
        messageApi.success({
          message: "Created",
          description: "OS Family has been created successfully",
          duration: 3,
        });
        form.resetFields();
        setOpen(false);
      } else {
        messageApi.error({
          message: "Failed",
          description: "Failed to create OS Family",
          duration: 3,
        });
      }
    } catch (error) {
      console.error("Error creating OS Family:", error);
      messageApi.error({
        message: "Failed",
        description: "An unexpected error occurred while creating the OS Family",
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <span onClick={() => setOpen(true)}>{children}</span>
    <Drawer title="Add OS Family" open={open} onClose={() => setOpen(false)} width={400} placement="right" destroyOnClose>
    <Card
      title="Add OS Family"
      extra={<Text type="secondary" className="dark:text-gray-300">Create a new OS Family</Text>}
      className="dark:bg-gray-800 dark:border-gray-700"
    >
      {contextHolder}
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        initialValues={{
          name: "",
          description: "",
        }}
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
          <Button type="primary" htmlType="submit" loading={loading}>Add OS Family</Button>
        </Form.Item>
      </Form>
    </Card>
    </Drawer>
    </>
  )
}

export default FormAddOSFamily