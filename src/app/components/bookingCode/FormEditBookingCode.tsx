import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Modal, DatePicker, Switch, message } from 'antd';
import { 
  updateBookingCode, 
  getBookingCodeById 
} from '@/app/actions/bookingCodes/crudActions';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

interface FormEditBookingCodeProps {
  children: React.ReactNode;
  bookingCodeId: number;
  onSuccess?: () => void;
}

const FormEditBookingCode: React.FC<FormEditBookingCodeProps> = ({ 
  children, 
  bookingCodeId,
  onSuccess 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const { data: bookingCodeData, isLoading } = useQuery({
    queryKey: ['bookingCode', bookingCodeId],
    queryFn: () => getBookingCodeById(bookingCodeId),
    enabled: isModalOpen,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: { 
      code?: string; 
      description?: string | null; 
      validFrom?: Date; 
      validTo?: Date; 
      enabled?: boolean 
    }) => updateBookingCode(bookingCodeId, values),
    onSuccess: (data) => {
      if (data.success) {
        messageApi.success('Booking code updated successfully');
        setIsModalOpen(false);
        if (onSuccess) onSuccess();
      } else {
        messageApi.error(data.error || 'Failed to update booking code');
      }
    },
    onError: (error: Error) => {
      messageApi.error(error.message || 'Failed to update booking code');
    },
  });

  useEffect(() => {
    if (bookingCodeData?.success && bookingCodeData.data) {
      form.setFieldsValue({
        code: bookingCodeData.data.code,
        description: bookingCodeData.data.description || '',
        validFrom: bookingCodeData.data.validFrom ? dayjs(bookingCodeData.data.validFrom) : undefined,
        validTo: bookingCodeData.data.validTo ? dayjs(bookingCodeData.data.validTo) : undefined,
        enabled: bookingCodeData.data.enabled,
      });
    }
  }, [bookingCodeData, form]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
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
      validFrom: values.validFrom ? values.validFrom.toDate() : undefined,
      validTo: values.validTo ? values.validTo.toDate() : undefined,
    });
  };

  return (
    <>
      {contextHolder}
      <div onClick={showModal} className="cursor-pointer">
        {children}
      </div>
      <Modal
        title="Edit Booking Code"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          disabled={isLoading}
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
              loading={isPending || isLoading}
              className="ml-2"
            >
              Update Booking Code
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

export default FormEditBookingCode;