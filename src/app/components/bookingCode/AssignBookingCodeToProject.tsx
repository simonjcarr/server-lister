import React, { useState } from 'react';
import { Button, Form, Select, Modal, message } from 'antd';
import { 
  assignBookingCodeToProject,
  getBookingCodeGroups
} from '@/app/actions/bookingCodes/crudActions';
import { useMutation, useQuery } from '@tanstack/react-query';

interface AssignBookingCodeToProjectProps {
  children: React.ReactNode;
  projectId: number;
  onSuccess?: () => void;
}

const AssignBookingCodeToProject: React.FC<AssignBookingCodeToProjectProps> = ({ 
  children, 
  projectId,
  onSuccess 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const { data: bookingCodeGroupsData, isLoading } = useQuery({
    queryKey: ['bookingCodeGroups'],
    queryFn: () => getBookingCodeGroups(),
    enabled: isModalOpen,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: { bookingCodeGroupId: number }) => 
      assignBookingCodeToProject({
        projectId,
        bookingCodeGroupId: values.bookingCodeGroupId,
      }),
    onSuccess: (data) => {
      if (data.success) {
        messageApi.success('Booking code assigned to project successfully');
        form.resetFields();
        setIsModalOpen(false);
        if (onSuccess) onSuccess();
      } else {
        messageApi.error(data.error || 'Failed to assign booking code to project');
      }
    },
    onError: (error: Error) => {
      messageApi.error(error.message || 'Failed to assign booking code to project');
    },
  });

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const onFinish = (values: { bookingCodeGroupId: number }) => {
    mutate(values);
  };

  return (
    <>
      {contextHolder}
      <div onClick={showModal} className="cursor-pointer">
        {children}
      </div>
      <Modal
        title="Assign Booking Code to Project"
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
            name="bookingCodeGroupId"
            label="Booking Code Group"
            rules={[{ required: true, message: 'Please select a booking code group' }]}
          >
            <Select
              placeholder="Select booking code group"
              loading={isLoading}
              options={
                bookingCodeGroupsData?.success && bookingCodeGroupsData.data
                  ? bookingCodeGroupsData.data.map((group) => ({
                      label: group.name,
                      value: group.id,
                    }))
                  : []
              }
            />
          </Form.Item>

          <Form.Item className="flex justify-end">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isPending}
              className="ml-2"
            >
              Assign Booking Code
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

export default AssignBookingCodeToProject;