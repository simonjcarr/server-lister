import React, { useState } from 'react';
import { Button, Form, Input, Modal, message } from 'antd';
import { createBookingCodeGroup } from '@/app/actions/bookingCodes/crudActions';
import { useMutation } from '@tanstack/react-query';

interface FormAddBookingCodeGroupProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

const FormAddBookingCodeGroup: React.FC<FormAddBookingCodeGroupProps> = ({ 
  children, 
  onSuccess 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const { mutate, isPending } = useMutation({
    mutationFn: createBookingCodeGroup,
    onSuccess: (data) => {
      if (data.success) {
        messageApi.success('Booking code group created successfully');
        form.resetFields();
        setIsModalOpen(false);
        if (onSuccess) onSuccess();
      } else {
        messageApi.error(data.error || 'Failed to create booking code group');
      }
    },
    onError: (error: Error) => {
      messageApi.error(error.message || 'Failed to create booking code group');
    },
  });

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const onFinish = (values: { name: string; description: string }) => {
    mutate(values);
  };

  return (
    <>
      {contextHolder}
      <div onClick={showModal} className="cursor-pointer">
        {children}
      </div>
      <Modal
        title="Add Booking Code Group"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a name for the booking code group' }]}
          >
            <Input placeholder="Enter booking code group name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Enter description" rows={3} />
          </Form.Item>

          <Form.Item className="flex justify-end">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isPending}
              className="ml-2"
            >
              Create Booking Code Group
            </Button>
            <Button onClick={handleCancel} className="ml-2">
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default FormAddBookingCodeGroup;