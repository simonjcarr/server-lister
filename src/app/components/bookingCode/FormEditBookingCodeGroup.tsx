import React, { useState, useEffect } from 'react';
import { Button, Form, Input, Modal, message } from 'antd';
import { 
  updateBookingCodeGroup, 
  getBookingCodeGroupById 
} from '@/app/actions/bookingCodes/crudActions';
import { useMutation, useQuery } from '@tanstack/react-query';
import { SelectBookingCodeGroup } from '@/db/schema/bookingCodes';

interface FormEditBookingCodeGroupProps {
  children: React.ReactNode;
  bookingCodeGroupId: number;
  onSuccess?: () => void;
}

const FormEditBookingCodeGroup: React.FC<FormEditBookingCodeGroupProps> = ({ 
  children, 
  bookingCodeGroupId,
  onSuccess 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const { data: bookingCodeGroupData, isLoading } = useQuery({
    queryKey: ['bookingCodeGroup', bookingCodeGroupId],
    queryFn: () => getBookingCodeGroupById(bookingCodeGroupId),
    enabled: isModalOpen,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: { name?: string; description?: string | null }) => 
      updateBookingCodeGroup(bookingCodeGroupId, values),
    onSuccess: (data) => {
      if (data.success) {
        messageApi.success('Booking code group updated successfully');
        setIsModalOpen(false);
        if (onSuccess) onSuccess();
      } else {
        messageApi.error(data.error || 'Failed to update booking code group');
      }
    },
    onError: (error: Error) => {
      messageApi.error(error.message || 'Failed to update booking code group');
    },
  });

  useEffect(() => {
    if (bookingCodeGroupData?.success && bookingCodeGroupData.data) {
      form.setFieldsValue({
        name: bookingCodeGroupData.data.name,
        description: bookingCodeGroupData.data.description || '',
      });
    }
  }, [bookingCodeGroupData, form]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
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
        title="Edit Booking Code Group"
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
              loading={isPending || isLoading}
              className="ml-2"
            >
              Update Booking Code Group
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

export default FormEditBookingCodeGroup;