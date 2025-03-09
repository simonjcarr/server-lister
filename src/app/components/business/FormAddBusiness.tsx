"use client";

import React, { useState } from 'react';
import { Button, Form, Input, notification, Card } from 'antd';
import { useRouter } from 'next/navigation';
import { createBusiness } from '@/app/actions/business/crudActions';

function FormAddBusiness() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { name: string }) => {
    setLoading(true);
    try {
      const result = await createBusiness(values);
      
      if (result.success) {
        notification.success({
          message: 'Success',
          description: 'Business created successfully!',
        });
        form.resetFields();
        router.push('/business/list');
      } else {
        throw new Error(result.error || 'Failed to create business');
      }
    } catch (error: any) {
      console.error('Error creating business:', error);
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to create business. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Add New Business"
      className="dark:bg-gray-800 dark:border-gray-700"
      styles={{
        header: { color: 'inherit' },
        body: { color: 'inherit' }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        className="dark:text-white"
      >
        <Form.Item
          name="name"
          label="Business Name"
          rules={[{ required: true, message: 'Please enter the business name' }]}
          className="dark:text-white"
        >
          <Input placeholder="Enter business name" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Business
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default FormAddBusiness;
