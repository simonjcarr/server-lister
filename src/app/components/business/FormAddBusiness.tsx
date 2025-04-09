"use client";

import React, { useState } from 'react';
import { Button, Form, Input, message, Card, Drawer } from 'antd';
import { createBusiness } from '@/app/actions/business/crudActions';
import { useMutation } from '@tanstack/react-query';
import type { InsertBusiness } from '@/db/schema'

function FormAddBusiness({ children }: { children?: React.ReactNode }) {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();


  const mutation = useMutation({
    mutationFn: (data: InsertBusiness) => createBusiness(data),
    onSuccess: () => {
      messageApi.success('Business created successfully!');
      form.resetFields();
      setOpen(false);
    },
    onError: (error: unknown) => {
      console.error('Error creating business:', error);
      messageApi.error(error instanceof Error ? error.message : 'Failed to create business. Please try again.');
    }
  });
  const onFinish = async (values: { name: string }) => {
    mutation.mutate({
      name: values.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  return (
    <>
      <span onClick={() => setOpen(true)}>{children || <Button type="primary">Add Business</Button>}</span>
      {contextHolder}
      <Drawer title="Add New Business" placement='right' open={open} onClose={() => setOpen(false)}>
        <Card
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
              <Input data-testid="test-form-add-business-name" placeholder="Enter business name" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </Form.Item>

            <Form.Item>
              <Button data-testid="test-form-add-business-submit-button" type="primary" htmlType="submit" loading={mutation.isPending}>
                Create Business
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Drawer>
    </>
  );
}

export default FormAddBusiness;
