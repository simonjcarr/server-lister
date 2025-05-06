'use client';

import { useState } from 'react';
import { Select, Button, Modal, Form, InputNumber, DatePicker, Input, message, Tooltip } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClockCircleOutlined } from '@ant-design/icons';
import { getAvailableBookingCodesForServer, createEngineerHours } from '@/app/actions/server/engineerHours/crudActions';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface EngineerHoursDropdownProps {
  serverId: number;
}

const EngineerHoursDropdown: React.FC<EngineerHoursDropdownProps> = ({ serverId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookingCode, setSelectedBookingCode] = useState<number | null>(null);
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

  const handleOpenModal = () => {
    if (selectedBookingCode) {
      setIsModalOpen(true);
    } else {
      messageApi.warning('Please select a booking code first');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createMutation.mutateAsync({
        serverId,
        bookingCodeId: selectedBookingCode!,
        minutes: values.minutes,
        note: values.note,
        date: values.date.toDate(),
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
      <Select
        placeholder="Select booking code"
        style={{ width: 200, marginRight: 8 }}
        loading={isLoadingBookingCodes}
        onChange={value => setSelectedBookingCode(value)}
        disabled={isLoadingBookingCodes || !bookingCodesData?.success}
        options={bookingCodesData?.success && bookingCodesData.data ? 
          bookingCodesData.data.map((code) => ({
            key: code.id,
            value: code.id,
            label: `${code.groupName}: ${code.code}`
          }))
          : undefined
        }
      />

      <Button 
        type="primary" 
        icon={<ClockCircleOutlined />} 
        onClick={handleOpenModal}
        disabled={!selectedBookingCode}
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