'use client';

import { useState } from 'react';
import { Card, Form, Input, Select, Button, message } from 'antd';
import { useRouter } from 'next/navigation';
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import { InsertSoftwareWhitelist } from '@/db/schema/softwareWhitelist';
import { createSoftwareWhitelist, fetchOSFamilies } from '@/app/actions/whitelist/whitelistActions';
import { useMutation, useQuery } from '@tanstack/react-query';

const { TextArea } = Input;
const { Option } = Select;

export default function AddSoftwareWhitelistPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);

  // Fetch OS families for the dropdown
  const { data: osFamilies, isLoading: loadingFamilies } = useQuery({
    queryKey: ['osFamilies'],
    queryFn: fetchOSFamilies,
  });

  // Mutation for creating software whitelist
  const createMutation = useMutation({
    mutationFn: createSoftwareWhitelist,
    onSuccess: (data) => {
      messageApi.success('Software added to whitelist successfully');
      // Navigate to the versions page for this software
      router.push(`/whitelist/versions/${data.id}`);
    },
    onError: (error) => {
      messageApi.error('Failed to add software to whitelist');
      console.error('Error:', error);
      setSubmitting(false);
    }
  });

  const handleSubmit = async (values: InsertSoftwareWhitelist) => {
    setSubmitting(true);
    try {
      createMutation.mutate(values);
    } catch (error) {
      console.error('Error submitting form:', error);
      messageApi.error('Failed to submit form');
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      {contextHolder}
      <div className="space-y-6">
        <Card title="Add Software to Whitelist">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              name="name"
              label="Software Name"
              rules={[{ required: true, message: 'Please enter the software name' }]}
            >
              <Input placeholder="e.g., Microsoft Office, mysql-server" />
            </Form.Item>

            <Form.Item
              name="osFamilyId"
              label="OS Family"
              rules={[{ required: true, message: 'Please select the OS family' }]}
            >
              <Select
                placeholder="Select OS Family"
                loading={loadingFamilies}
                disabled={loadingFamilies}
              >
                {osFamilies?.map(family => (
                  <Option key={family.id} value={family.id}>
                    {family.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea
                placeholder="Optional description of the software"
                rows={4}
              />
            </Form.Item>

            <Form.Item>
              <div className="flex justify-end space-x-2">
                <Button onClick={() => router.push('/whitelist')}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  Add & Continue to Versions
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
