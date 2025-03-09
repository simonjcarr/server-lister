"use client";

import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Select, notification, Card } from 'antd';
import { useRouter } from 'next/navigation';
import { createProject, ProjectFormData } from '@/app/actions/projects/crudActions';
import { getBusinesses } from '@/app/actions/business/crudActions';

interface Business {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

function FormAddProject() {
  const [form] = Form.useForm();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch businesses for the dropdown
    const fetchBusinesses = async () => {
      try {
        setLoadingBusinesses(true);
        const result = await getBusinesses();
        if (result.success && result.data) {
          setBusinesses(result.data as Business[]);
        } else {
          throw new Error(result.error || 'Failed to load businesses');
        }
      } catch (error: any) {
        console.error('Error fetching businesses:', error);
        notification.error({
          message: 'Error',
          description: error.message || 'Failed to load businesses. Please try again later.',
        });
      } finally {
        setLoadingBusinesses(false);
      }
    };

    fetchBusinesses();
  }, []);

  const onFinish = async (values: ProjectFormData) => {
    setLoading(true);
    try {
      const result = await createProject(values);
      
      if (result.success) {
        notification.success({
          message: 'Success',
          description: 'Project created successfully!',
        });
        form.resetFields();
        router.push('/project/list');
      } else {
        throw new Error(result.error || 'Failed to create project');
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to create project. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Add New Project"
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
          label="Project Name"
          rules={[{ required: true, message: 'Please enter the project name' }]}
          className="dark:text-white"
        >
          <Input placeholder="Enter project name" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          className="dark:text-white"
        >
          <Input.TextArea 
            placeholder="Enter project description" 
            rows={4}
            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </Form.Item>

        <Form.Item
          name="business"
          label="Business"
          className="dark:text-white"
        >
          <Select
            placeholder="Select a business"
            loading={loadingBusinesses}
            allowClear
            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            dropdownStyle={{ backgroundColor: 'var(--bg-dropdown)', color: 'var(--text-dropdown)' }}
          >
            {businesses.map((business) => (
              <Select.Option key={business.id} value={business.id}>
                {business.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="code"
          label="Project Code"
          className="dark:text-white"
        >
          <Input placeholder="Enter project code" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Project
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default FormAddProject;