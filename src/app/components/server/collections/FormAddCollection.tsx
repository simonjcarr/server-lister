'use client';

import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Modal, notification } from 'antd';
import { createCollection } from '@/app/actions/server/collectionActions';
import { useQueryClient } from '@tanstack/react-query';

interface FormAddCollectionProps {
  children: React.ReactNode;
}

interface ActionResult {
  success: boolean;
  message?: string;
  collectionId?: number;
}

const FormAddCollection: React.FC<FormAddCollectionProps> = ({ children }) => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [api, contextHolder] = notification.useNotification();
  const queryClient = useQueryClient();

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
          description: 'Collection created successfully'
        };
        
        // Invalidate and refetch collections
        queryClient.invalidateQueries({ queryKey: ['collections-with-subscription'] });
        
        form.resetFields();
        setIsModalOpen(false);
      } else {
        // Set notification config for error
        notificationConfig.current = {
          type: 'error',
          message: 'Error',
          description: actionResult.message || 'Failed to create collection'
        };
      }
      
      // Reset the result after handling
      setActionResult(null);
    }
  }, [actionResult, form, queryClient]);
  
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
      const result = await createCollection({
        name: values.name,
        description: values.description || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Set the result to trigger the effect instead of showing notification directly
      setActionResult(result);
    } catch (error) {
      console.error('Error creating collection:', error);
      setActionResult({ 
        success: false, 
        message: 'An unexpected error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div onClick={showModal} className="cursor-pointer">
        {children}
      </div>
      <Modal
        title="Add New Collection"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ name: '', description: '' }}
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
                Create Collection
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default FormAddCollection;