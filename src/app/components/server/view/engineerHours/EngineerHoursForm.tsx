'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Select, DatePicker, message, Tooltip } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAvailableBookingCodesForServer, createEngineerHours } from '@/app/actions/server/engineerHours/crudActions';
import dayjs from 'dayjs';
import { useSession } from "next-auth/react";
import { parseTimeInput, formatTimeFromMinutes } from '@/lib/utils/timeParser';

const { TextArea } = Input;

interface EngineerHoursFormProps {
  serverId: number;
  onSuccess?: () => void;
}

const EngineerHoursForm: React.FC<EngineerHoursFormProps> = ({ serverId, onSuccess }) => {
  const { data: session } = useSession();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const queryClient = useQueryClient();
  const [timeInputValue, setTimeInputValue] = useState<string>('30m');
  const [parsedMinutes, setParsedMinutes] = useState<number | null>(30);
  
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
        setTimeInputValue('30m');
        setParsedMinutes(30);
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

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTimeInputValue(value);
    
    const minutes = parseTimeInput(value);
    setParsedMinutes(minutes);
    
    // Update the hidden form field with the parsed minutes
    form.setFieldValue('minutes', minutes);
  };

  const handleSubmit = async (values: { bookingCodeId: number; minutes: number; note?: string; date: dayjs.Dayjs }) => {
    if (!session?.user?.id) {
      messageApi.error('You must be logged in to log hours');
      return;
    }
    
    // Validate that we have valid minutes
    if (parsedMinutes === null || parsedMinutes <= 0) {
      messageApi.error('Please enter a valid time format');
      return;
    }
    
    await createMutation.mutateAsync({
      serverId,
      bookingCodeId: values.bookingCodeId,
      minutes: parsedMinutes, // Use the parsed minutes from our custom input
      note: values.note,
      date: values.date.toDate(),
      userId: session.user.id,
    });
  };

  // Show debugging information if no booking codes are found
  const hasNoBookingCodes = bookingCodesData?.success && (!bookingCodesData.data || bookingCodesData.data.length === 0);
  const debugMessage = bookingCodesData?.debug;
  
  return (
    <div>
      {contextHolder}
      
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
          minutes: 30, // This is a hidden field that will be updated based on the time input
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
            showSearch
            filterOption={(input, option) => 
              (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
            }
            optionFilterProp="label"
          />
        </Form.Item>

        {/* Hidden field to store the parsed minutes value */}
        <Form.Item
          name="minutes"
          hidden
        >
          <Input type="hidden" />
        </Form.Item>

        {/* Custom time input field */}
        <Form.Item
          label={
            <Tooltip title="Supports formats like: 30m, 1h 30m, 1:30, 1.5h">
              <span>Time <span className="text-gray-400">(hover for formats)</span></span>
            </Tooltip>
          }
          required
          validateStatus={parsedMinutes === null ? 'error' : 'success'}
          help={parsedMinutes === null ? 'Please enter a valid time format (e.g., 30m, 1h 30m, 1:30)' : parsedMinutes > 0 ? `${formatTimeFromMinutes(parsedMinutes)} (${parsedMinutes} minutes)` : 'Time must be greater than 0'}
        >
          <Input
            value={timeInputValue}
            onChange={handleTimeInputChange}
            placeholder="e.g., 30m, 1h 30m, 1:30"
            style={{ width: '100%' }}
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

        <Form.Item className="mb-0">
          <div className="flex justify-end gap-2">
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={createMutation.isPending}
              disabled={parsedMinutes === null || parsedMinutes <= 0}
            >
              Submit
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EngineerHoursForm;