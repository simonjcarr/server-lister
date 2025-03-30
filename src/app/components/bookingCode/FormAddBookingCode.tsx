import React, { useState } from 'react';
import { Button, Form, Input, Modal, DatePicker, Switch, message } from 'antd';
import { createBookingCode } from '@/app/actions/bookingCodes/crudActions';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';

interface FormAddBookingCodeProps {
  children: React.ReactNode;
  groupId: number;
  onSuccess?: () => void;
}

const FormAddBookingCode: React.FC<FormAddBookingCodeProps> = ({ 
  children, 
  groupId,
  onSuccess 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const { mutate, isPending } = useMutation({
    mutationFn: (values: { 
      code: string; 
      description: string; 
      validFrom: Date; 
      validTo: Date; 
      enabled: boolean 
    }) => createBookingCode({
      ...values,
      groupId
    }),
    onSuccess: (data) => {
      if (data.success) {
        messageApi.success('Booking code created successfully');
        form.resetFields();
        setIsModalOpen(false);
        if (onSuccess) onSuccess();
      } else {
        messageApi.error(data.error || 'Failed to create booking code');
      }
    },
    onError: (error: Error) => {
      messageApi.error(error.message || 'Failed to create booking code');
    },
  });

  const showModal = () => {
    // Set default values for the form
    form.setFieldsValue({
      enabled: true,
      validFrom: dayjs(),
      validTo: dayjs().add(1, 'year'),
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const onFinish = (values: { 
    code: string; 
    description: string; 
    validFrom: dayjs.Dayjs; 
    validTo: dayjs.Dayjs; 
    enabled: boolean 
  }) => {
    mutate({
      ...values,
      validFrom: values.validFrom.toDate(),
      validTo: values.validTo.toDate(),
    });
  };

  return (
    <>
      {contextHolder}
      <div onClick={showModal} className="cursor-pointer">
        {children}
      </div>
      <Modal
        title="Add Booking Code"
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
            name="code"
            label="Booking Code"
            rules={[{ required: true, message: 'Please enter a booking code' }]}
          >
            <Input placeholder="Enter booking code" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Enter description" rows={3} />
          </Form.Item>

          <Form.Item
            name="validFrom"
            label="Valid From"
            rules={[{ required: true, message: 'Please select valid from date' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            name="validTo"
            label="Valid To"
            rules={[{ required: true, message: 'Please select valid to date' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            name="enabled"
            label="Enabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item className="flex justify-end">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isPending}
              className="ml-2"
            >
              Create Booking Code
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

export default FormAddBookingCode;