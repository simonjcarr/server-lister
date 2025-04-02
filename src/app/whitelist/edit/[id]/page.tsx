'use client';

import { useParams } from 'next/navigation';

import { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Spin, message } from 'antd';
import { useRouter } from 'next/navigation';
import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import { UpdateSoftwareWhitelist } from '@/db/schema/softwareWhitelist';
import { fetchSoftwareWhitelistItem, updateSoftwareWhitelist, fetchOSFamilies } from '@/app/actions/whitelist/whitelistActions';
import { useMutation, useQuery } from '@tanstack/react-query';

const { TextArea } = Input;
const { Option } = Select;

export default function EditSoftwareWhitelistPage() {
  const params = useParams<{id: string}>();
  const softwareId = parseInt(params.id);
  const router = useRouter();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);

  // Fetch the software details
  const { data: software, isLoading: loadingSoftware } = useQuery({
    queryKey: ['softwareWhitelist', softwareId],
    queryFn: () => fetchSoftwareWhitelistItem(softwareId),
    enabled: !isNaN(softwareId),
  });

  // Fetch OS families for the dropdown
  const { data: osFamilies, isLoading: loadingFamilies } = useQuery({
    queryKey: ['osFamilies'],
    queryFn: fetchOSFamilies,
  });

  // Update form values when data is loaded
  useEffect(() => {
    if (software) {
      form.setFieldsValue({
        name: software.name,
        osFamilyId: software.osFamilyId,
        description: software.description,
      });
    }
  }, [software, form]);

  // Mutation for updating software whitelist
  const updateMutation = useMutation({
    mutationFn: (data: UpdateSoftwareWhitelist) => updateSoftwareWhitelist(softwareId, data),
    onSuccess: () => {
      messageApi.success('Software updated successfully');
      router.push('/whitelist');
    },
    onError: (error) => {
      messageApi.error('Failed to update software');
      console.error('Error:', error);
      setSubmitting(false);
    }
  });

  const handleSubmit = async (values: UpdateSoftwareWhitelist) => {
    setSubmitting(true);
    try {
      updateMutation.mutate(values);
    } catch (error) {
      console.error('Error submitting form:', error);
      messageApi.error('Failed to submit form');
      setSubmitting(false);
    }
  };

  if (loadingSoftware || loadingFamilies) {
    return (
      <ProtectedRoute>
        <div className="flex justify-center p-8">
          <Spin>
            <div className="p-12">Loading...</div>
          </Spin>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      {contextHolder}
      <div className="space-y-6">
        <Card title="Edit Software Whitelist">
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
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitting}
                >
                  Update Software
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
