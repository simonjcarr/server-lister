'use client'
import { addOS } from '@/app/actions/os/crudActions';
import { getOSFamilies } from '@/app/actions/os/osFamilyActions';
import { InsertOS, InsertOSFamily } from '@/db/schema';
import { Card, Form, Input, Button, notification, Drawer, Select, Tabs } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { addOSFamily } from '@/app/actions/os/osFamilyActions';
const { TextArea } = Input;

const { TabPane } = Tabs;
type TabKey = 'os' | 'osFamily';

function FormAddOS({children, initialTab = 'os'}: {children: React.ReactNode, initialTab?: TabKey}) {
  const [open, setOpen] = useState(false);
  const [osForm] = Form.useForm();
  const [osFamilyForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = notification.useNotification();
  const queryClient = useQueryClient();
  
  const addOSFamilyMutation = useMutation({
    mutationFn: addOSFamily,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['osFamilies'] });
    }
  });

  const addOSMutation = useMutation({
    mutationFn: (values: InsertOS) => addOS(values),
    onSuccess: () => {
      messageApi.success({
        message: "Created",
        description: "OS has been created successfully",
        duration: 3,
      });
      osForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['os'] });
      queryClient.invalidateQueries({ queryKey: ['osFamilyWithCount'] });
      queryClient.invalidateQueries({ queryKey: ['osFamilies'] });
    },
    onError: (error: unknown) => {
      console.error("Error creating OS:", error);
      messageApi.error({
        message: "Failed",
        description: "An unexpected error occurred while creating the OS",
        duration: 3,
      });
    },
    onSettled: () => {
      setLoading(false);
    }
  });
  
  // Fetch OS Families for the dropdown
  const { data: osFamilies = [], isLoading: isFamiliesLoading } = useQuery({
    queryKey: ['osFamilies'],
    queryFn: getOSFamilies,
  });

  // Handle OS form submission
  async function onFinishOS(values: InsertOS) {
    setLoading(true);
    addOSMutation.mutate(values);
  }

  // Handle OS Family form submission
  async function onFinishOSFamily(values: InsertOSFamily) {
    try {
      setLoading(true);
      // Submit to server action
      const result = await addOSFamilyMutation.mutateAsync(values);

      if (result.success) {
        messageApi.success({
          message: "Created",
          description: "OS Family has been created successfully",
          duration: 3,
        });
        osFamilyForm.resetFields();
        
        // Invalidate all OS family related queries with different patterns that might be used
        queryClient.invalidateQueries({ queryKey: ['osFamilies'] });
        queryClient.invalidateQueries({ queryKey: ['osFamilyWithCount'] });
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
    <Drawer title={activeTab === 'os' ? "Add Operating System" : "Add OS Family"} open={open} onClose={() => setOpen(false)} width={400} placement="right" destroyOnClose>
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      {contextHolder}
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as TabKey)}>
        <TabPane tab="Operating System" key="os">
          <Form
            form={osForm}
            onFinish={onFinishOS}
            layout="vertical"
            initialValues={{
              name: "",
              description: "",
              EOLDate: "",
              version: "",
              osFamilyId: null,
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
              <Input data-testid="add-os-form-name" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
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
              <Input data-testid="add-os-form-version" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </Form.Item>

            <Form.Item
              name="osFamilyId"
              label="OS Family"
              className="dark:text-white"
            >
              <Select
                data-testid="add-os-form-os-family"
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="Select OS Family"
                loading={isFamiliesLoading}
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
              <Input data-testid="add-os-form-eol-date" type="date" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
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
              <Button data-testid="add-os-button" type="primary" htmlType="submit" loading={loading}>Add OS</Button>
            </Form.Item>
          </Form>
        </TabPane>
        
        <TabPane tab="OS Family" key="osFamily">
          <Form
            form={osFamilyForm}
            onFinish={onFinishOSFamily}
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
              <Input data-testid="add-os-form-family-name" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
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
              <Button data-testid="add-os-family-button" type="primary" htmlType="submit" loading={loading}>Add OS Family</Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </Card>
    </Drawer>
    </>
  )
}

export default FormAddOS