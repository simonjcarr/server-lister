'use client';

import { useState } from 'react';
import { Select, Button, Modal, Form, InputNumber, DatePicker, Input, message, Tooltip } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClockCircleOutlined } from '@ant-design/icons';
import { getAvailableBookingCodesForServer, createEngineerHours } from '@/app/actions/server/engineerHours/crudActions';
import dayjs from 'dayjs';
import { useSession } from "next-auth/react";

const { TextArea } = Input;

interface EngineerHoursDropdownProps {
  serverId: number;
}

const EngineerHoursDropdown: React.FC<EngineerHoursDropdownProps> = ({ serverId }) => {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const queryClient = useQueryClient();

  // Query to get available booking codes for this server
  const { data: bookingCodesData, isLoading: isLoadingBookingCodes } = useQuery({
    queryKey: ['availableBookingCodes', serverId],
    queryFn: () => getAvailableBookingCodesForServer(serverId),
    enabled: !!serverId,
  });

  // Mutation for creating engineer hours
  const createMutation = useMutation({
    mutationFn: createEngineerHours,
    onSuccess: (data) => {
      if (data.success) {
        messageApi.success('Hours logged successfully');
        queryClient.invalidateQueries({ queryKey: ['engineerHours', serverId] });
        setIsModalOpen(false);
        form.resetFields();
      } else {
        messageApi.error(data.error || 'Failed to log hours');
      }
    },
    onError: (error) => {
      messageApi.error('An error occurred while logging hours');
      console.error('Error logging hours:', error);
    },
  });


  const handleSubmit = async () => {
    try {
      if (!session?.user?.id) {
        messageApi.error('You must be logged in to log hours');
        return;
      }
      
      const values = await form.validateFields();
      await createMutation.mutateAsync({
        serverId,
        bookingCodeId: values.bookingCodeId,
        minutes: values.minutes,
        note: values.note,
        date: values.date.toDate(),
        userId: session.user.id
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Check for debugging conditions
  const hasNoBookingCodes = bookingCodesData?.success && (!bookingCodesData.data || bookingCodesData.data.length === 0);
  const hasError = bookingCodesData?.success === false;
  const debugMessage = bookingCodesData?.debug;
  
  // Show debugging tooltip instead of hiding completely
  if (hasNoBookingCodes || hasError) {
    const tooltipTitle = hasNoBookingCodes
      ? <div>
          <p>No booking codes available for this server. Check that the server has a project with assigned booking codes.</p>
          {debugMessage && <p className="text-yellow-300 mt-1">Diagnostic info: {debugMessage}</p>}
        </div>
      : `Error loading booking codes: ${bookingCodesData?.error || "Unknown error"}`;
    
    return (
      <div className="flex items-center">
        {contextHolder}
        <Tooltip title={tooltipTitle}>
          <Button 
            type="default" 
            icon={<ClockCircleOutlined />} 
            disabled={true}
          >
            Log Hours
          </Button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {contextHolder}
      <Button 
        type="primary" 
        icon={<ClockCircleOutlined />} 
        onClick={() => setIsModalOpen(true)}
      >
        Log Hours
      </Button>

      <Modal
        title="Log Engineer Hours"
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={createMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            date: dayjs(),
            minutes: 30,
          }}
        >
          <Form.Item
            name="bookingCodeId"
            label="Booking Code"
            rules={[{ required: true, message: 'Please select a booking code' }]}
            help={hasNoBookingCodes ? "No booking codes available for this server" : ""}
          >
            <Select
              placeholder="Select a booking code"
              loading={isLoadingBookingCodes}
              disabled={isLoadingBookingCodes || !bookingCodesData?.success || hasNoBookingCodes}
              options={bookingCodesData?.success && bookingCodesData.data ? 
                bookingCodesData.data.map((code) => ({
                  key: code.id,
                  value: code.id,
                  label: `${code.groupName}: ${code.code}${code.description ? ` - ${code.description}` : ''}`
                })) 
                : undefined
              }
              style={{ width: '100%' }}
              showSearch
              filterOption={(input, option) => 
                (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
              }
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            name="minutes"
            label="Minutes"
            rules={[{ required: true, message: 'Please enter minutes' }]}
          >
            <InputNumber
              min={1}
              max={1440}
              style={{ width: '100%' }}
              placeholder="Enter minutes worked"
            />
          </Form.Item>

          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="note"
            label="Note"
          >
            <TextArea
              rows={4}
              placeholder="Enter details about the work performed"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EngineerHoursDropdown;