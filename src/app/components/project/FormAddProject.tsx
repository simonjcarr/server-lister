"use client";

import { Button, Form, Input, Select, notification, Card, Drawer } from 'antd';
import { useRouter } from 'next/navigation';
import { createProject } from '@/app/actions/projects/crudActions';
import { getBusinesses } from '@/app/actions/business/crudActions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { InsertProject } from '@/db/schema';
import { useState } from 'react';


function FormAddProject({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [notificationApi, contextHolder] = notification.useNotification();

  const { data: businesses, isLoading: isLoadingBusinesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => getBusinesses(),
  });

  const mutation = useMutation({
    mutationFn: (values: InsertProject) => createProject(values),
    onSuccess: () => {
      notificationApi.success({
        message: 'Success',
        description: 'Project created successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      form.resetFields();
      router.push('/project/list');
    },
    onError: (error: unknown) => {
      console.error('Error creating project:', error);
      notificationApi.error({
        message: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create project. Please try again.',
      });
    },
  })

  const onFinish = async (values: InsertProject) => {
    mutation.mutate(values)
  };

  return (
    <>
      {contextHolder}
      <span onClick={() => setOpen(true)}>{children}</span>
      <Drawer title="Add New Project" open={open} onClose={() => setOpen(false)} placement="right" >
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
              label="Project Name"
              rules={[{ required: true, message: 'Please enter the project name' }]}
              className="dark:text-white"
            >
              <Input data-testid="test-form-add-project-name" placeholder="Enter project name" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
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
                data-testid="test-form-add-project-business"
                placeholder="Select a business"
                loading={isLoadingBusinesses}
                allowClear
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                dropdownStyle={{ backgroundColor: 'var(--bg-dropdown)', color: 'var(--text-dropdown)' }}
              >
                {businesses?.map((business) => (
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
              <Button data-testid="test-form-add-project-submit-button" type="primary" htmlType="submit" loading={mutation.isPending}>
                Create Project
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Drawer>
    </>
  );
}

export default FormAddProject;