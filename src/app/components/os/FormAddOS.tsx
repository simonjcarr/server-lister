'use client'
import { addOS } from '@/app/actions/os/curdActions';
import { InsertOS } from '@/db/schema';
import { Card, Form, Input, Button, notification, Typography } from 'antd'
import { useState } from 'react';
const { TextArea } = Input;
const { Text } = Typography;

function FormAddOS() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = notification.useNotification();

  // Handle form submission
  async function onFinish(values: InsertOS) {
    try {
      setLoading(true);
      // Submit to server action
      const result = await addOS(values);
      
      if (result.success) {
        messageApi.success({
          message: "Created",
          description: "OS has been created successfully",
          duration: 3,
        });
        form.resetFields();
      } else {
        messageApi.error({
          message: "Failed",
          description: "Failed to create OS",
          duration: 3,
        });
      }
    } catch (error) {
      console.error("Error creating OS:", error);
      messageApi.error({
        message: "Failed",
        description: "An unexpected error occurred while creating the OS",
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card 
      title="Add OS" 
      extra={<Text type="secondary" className="dark:text-gray-300">Create a new server OS</Text>}
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
          EOLDate: "",
          version: "",
        }}
        className="dark:text-white"
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
          <Button type="primary" htmlType="submit" loading={loading}>Add OS</Button>
        </Form.Item>
      </Form>

    </Card>
  )
}

export default FormAddOS