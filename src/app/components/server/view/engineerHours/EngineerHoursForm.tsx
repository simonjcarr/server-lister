'use client';

import React from 'react';
import { Form, Input, Button, Select, DatePicker, InputNumber, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAvailableBookingCodesForServer, createEngineerHours } from '@/app/actions/server/engineerHours/crudActions';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface EngineerHoursFormProps {
  serverId: number;
  onSuccess?: () => void;
}

const EngineerHoursForm: React.FC<EngineerHoursFormProps> = ({ serverId, onSuccess }) => {
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
        form.resetFields();
        if (onSuccess) onSuccess();
      } else {
        messageApi.error(data.error || 'Failed to log hours');
      }
    },
    onError: (error) => {
      messageApi.error('An error occurred while logging hours');
      console.error('Error logging hours:', error);
    },
  });

  const handleSubmit = async (values: { bookingCodeId: number; minutes: number; note?: string; date: dayjs.Dayjs }) => {
    await createMutation.mutateAsync({
      serverId,
      bookingCodeId: values.bookingCodeId,
      minutes: values.minutes,
      note: values.note,
      date: values.date.toDate(),
    });
  };

  // Show debugging information if no booking codes are found
  const hasNoBookingCodes = bookingCodesData?.success && (!bookingCodesData.data || bookingCodesData.data.length === 0);
  const debugMessage = (bookingCodesData as any)?.debug;
  
  return (
    <div className="p-4 bg-gray-800/50 rounded-lg">
      {contextHolder}
      <h3 className="text-lg font-medium mb-4">Log Engineer Hours</h3>
      
      {/* Show debug information if needed */}
      {hasNoBookingCodes && (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded text-sm">
          <p>No booking codes found for this server. Please make sure:</p>
          <ol className="list-decimal pl-5 mt-2">
            <li>The server has a project assigned</li>
            <li>The project has booking code groups assigned</li>
            <li>The booking code groups have active booking codes</li>
          </ol>
          
          {debugMessage && (
            <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
              <p>Diagnostic info: {debugMessage}</p>
            </div>
          )}
        </div>
      )}
      
      {bookingCodesData?.success === false && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-sm">
          <p>Error loading booking codes: {bookingCodesData.error}</p>
        </div>
      )}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
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
          >
            {bookingCodesData?.success && bookingCodesData.data && bookingCodesData.data.map((code: { id: number; groupName: string; code: string; description?: string }) => (
              <Option key={code.id} value={code.id}>
                {code.groupName}: {code.code} {code.description ? `- ${code.description}` : ''}
              </Option>
            ))}
          </Select>
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

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={createMutation.isPending}
            className="w-full"
          >
            Log Hours
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EngineerHoursForm;