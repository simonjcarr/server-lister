'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  const [api] = notification.useNotification();
  const queryClient = useQueryClient();

  // Create stable callbacks for notifications
  const showSuccessNotification = useCallback(() => {
    api.success({
      message: 'Success',
      description: 'Collection created successfully',
      duration: 3,
    });
  }, [api]);

  const showErrorNotification = useCallback((message: string) => {
    api.error({
      message: 'Error',
      description: message || 'Failed to create collection',
      duration: 3,
    });
  }, [api]);

  // Handle notifications in an effect using stable callbacks
  useEffect(() => {
    if (actionResult) {
      if (actionResult.success) {
        showSuccessNotification();
        
        // Invalidate and refetch collections
        queryClient.invalidateQueries({ queryKey: ['collections'] });
        
        form.resetFields();
        setIsModalOpen(false);
      } else {
        showErrorNotification(actionResult.message || 'Failed to create collection');
      }
      
      // Reset the result after handling
      setActionResult(null);
    }
  }, [actionResult, showSuccessNotification, showErrorNotification, form, queryClient]);

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