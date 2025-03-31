'use client';

import React, { useEffect, useState } from 'react';
import { Button, Form, Input, Modal, notification } from 'antd';
import { updateCollection } from '@/app/actions/server/collectionActions';
import { useQueryClient } from '@tanstack/react-query';
import { SelectCollection } from '@/db/schema';

interface FormEditCollectionProps {
  collection: SelectCollection;
  children: React.ReactNode;
}

interface ActionResult {
  success: boolean;
  message?: string;
}

const FormEditCollection: React.FC<FormEditCollectionProps> = ({ collection, children }) => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [api, contextHolder] = notification.useNotification();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (collection && isModalOpen) {
      form.setFieldsValue({
        name: collection.name,
        description: collection.description || '',
      });
    }
  }, [collection, form, isModalOpen]);

  // Using a ref for storing notification config to avoid calling during render
  const notificationConfig = React.useRef<{
    type: 'success' | 'error';
    message: string;
    description: string;
  } | null>(null);

  // Handle notifications and state updates in an effect
  useEffect(() => {
    if (actionResult) {
      if (actionResult.success) {
        // Set notification config to be shown in the next effect
        notificationConfig.current = {
          type: 'success',
          message: 'Success',
          description: 'Collection updated successfully'
        };
        
        // Invalidate and refetch collections
        queryClient.invalidateQueries({ queryKey: ['collections-with-subscription'] });
        queryClient.invalidateQueries({ queryKey: ['collection', collection.id] });
        
        form.resetFields();
        setIsModalOpen(false);
      } else {
        // Set notification config for error
        notificationConfig.current = {
          type: 'error',
          message: 'Error',
          description: actionResult.message || 'Failed to update collection'
        };
      }
      
      // Reset the result after handling
      setActionResult(null);
    }
  }, [actionResult, form, queryClient, collection.id]);
  
  // Separate effect for showing notifications to avoid calling during render
  useEffect(() => {
    if (notificationConfig.current) {
      const { type, message, description } = notificationConfig.current;
      if (type === 'success') {
        api.success({
          message,
          description,
          duration: 3,
        });
      } else {
        api.error({
          message,
          description,
          duration: 3,
        });
      }
      notificationConfig.current = null;
    }
  }, [actionResult, api]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const handleSubmit = async (values: { name: string; description: string }) => {
    setIsSubmitting(true);
    try {
      const result = await updateCollection(collection.id, {
        name: values.name,
        description: values.description || null,
      });

      // Set the result to trigger the effect instead of showing notification directly
      setActionResult(result);
    } catch (error) {
      console.error('Error updating collection:', error);
      setActionResult({
        success: false,
        message: 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div onClick={showModal}>{children}</div>
      <Modal
        title="Edit Collection"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ name: collection.name, description: collection.description || '' }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a collection name' }]}
          >
            <Input placeholder="Enter collection name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea
              placeholder="Enter collection description (optional)"
              rows={4}
            />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end space-x-2">
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                Update Collection
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default FormEditCollection;