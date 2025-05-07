'use client';

import { useState, useEffect } from 'react';
import { Button, Modal, Form, Select, DatePicker, Input, message, Tooltip } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClockCircleOutlined } from '@ant-design/icons';
import { getServerList } from '@/app/actions/server/crudActions';
import { getAvailableBookingCodesForServer, createEngineerHours } from '@/app/actions/server/engineerHours/crudActions';
import dayjs from 'dayjs';
import { useSession } from "next-auth/react";
import { parseTimeInput, formatTimeFromMinutes } from '@/lib/utils/timeParser';

const { TextArea } = Input;

const GlobalEngineerHoursButton: React.FC = () => {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const queryClient = useQueryClient();
  const [timeInputValue, setTimeInputValue] = useState<string>('30m');
  const [parsedMinutes, setParsedMinutes] = useState<number | null>(30);

  // Query to get the server list
  const { data: serversData, isLoading: isLoadingServers } = useQuery({
    queryKey: ['serverList'],
    queryFn: () => getServerList(),
    enabled: isModalOpen, // Only fetch when modal is open
    staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
    retry: 2, // Only retry twice on failure
  });

  // Query to get available booking codes for the selected server
  const { data: bookingCodesData, isLoading: isLoadingBookingCodes } = useQuery({
    queryKey: ['availableBookingCodes', selectedServerId],
    queryFn: () => getAvailableBookingCodesForServer(selectedServerId!),
    enabled: !!selectedServerId,
    staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
    retry: 2, // Only retry twice on failure
  });

  // Mutation for creating engineer hours
  const createMutation = useMutation({
    mutationFn: createEngineerHours,
    onSuccess: (data) => {
      if (data.success) {
        messageApi.success('Hours logged successfully');
        queryClient.invalidateQueries({ queryKey: ['engineerHours'] });
        setIsModalOpen(false);
        form.resetFields();
        setSelectedServerId(null);
        setTimeInputValue('30m');
        setParsedMinutes(30);
      } else {
        messageApi.error(data.error || 'Failed to log hours');
      }
    },
    onError: (error) => {
      messageApi.error('An error occurred while logging hours');
      console.error('Error logging hours:', error);
    },
  });

  const handleServerChange = (value: number) => {
    // Update the selected server ID
    setSelectedServerId(value);
    
    // Instead of directly setting form value, update in the next render cycle with useEffect
    // The clearing of bookingCodeId will be handled by the useEffect below
  };
  
  // Use effect to clear the booking code when server changes
  useEffect(() => {
    if (selectedServerId && form) {
      // When server changes, reset the booking code field
      form.setFieldsValue({ bookingCodeId: undefined });
    }
  }, [selectedServerId, form]);
  
  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTimeInputValue(value);
    
    const minutes = parseTimeInput(value);
    setParsedMinutes(minutes);
    
    // Update the hidden form field with the parsed minutes
    form.setFieldValue('minutes', minutes);
  };

  const handleSubmit = async () => {
    try {
      if (!session?.user?.id) {
        messageApi.error('You must be logged in to log hours');
        return;
      }
      
      if (!selectedServerId) {
        messageApi.error('Please select a server');
        return;
      }
      
      // Validate that we have valid minutes
      if (parsedMinutes === null || parsedMinutes <= 0) {
        messageApi.error('Please enter a valid time format');
        return;
      }
      
      const values = await form.validateFields();
      await createMutation.mutateAsync({
        serverId: selectedServerId,
        bookingCodeId: values.bookingCodeId,
        minutes: parsedMinutes, // Use parsed minutes instead of form value
        note: values.note,
        date: values.date.toDate(),
        userId: session.user.id
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Check for debugging conditions for booking codes
  const hasNoBookingCodes = bookingCodesData?.success && (!bookingCodesData.data || bookingCodesData.data.length === 0);

  return (
    <>
      {contextHolder}
      <Tooltip title="Log Engineer Hours">
        <Button
          icon={<ClockCircleOutlined />}
          onClick={() => setIsModalOpen(true)}
          type="text"
          className="text-gray-400 hover:text-white"
        />
      </Tooltip>

      <Modal
        title="Log Engineer Hours"
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedServerId(null);
          form.resetFields();
          setTimeInputValue('30m');
          setParsedMinutes(30);
        }}
        confirmLoading={createMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            date: dayjs(),
            minutes: 30,
            timeInput: '30m',
          }}
        >
          <Form.Item
            name="serverId"
            label="Server"
            rules={[{ required: true, message: 'Please select a server' }]}
          >
            <Select
              placeholder="Select a server"
              loading={isLoadingServers}
              onChange={handleServerChange}
              showSearch
              filterOption={(input, option) => 
                (option?.label?.toString().toLowerCase() || '').includes(input.toLowerCase())
              }
              optionFilterProp="label"
              style={{ width: '100%' }}
              options={serversData?.map(server => ({
                key: server.id,
                value: server.id,
                label: `${server.hostname} (${server.ipv4 || 'No IP'})`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="bookingCodeId"
            label="Booking Code"
            rules={[{ required: true, message: 'Please select a booking code' }]}
            help={hasNoBookingCodes ? "No booking codes available for this server" : ""}
          >
            <Select
              placeholder="Select a booking code"
              loading={isLoadingBookingCodes}
              disabled={!selectedServerId || isLoadingBookingCodes || !bookingCodesData?.success || hasNoBookingCodes}
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
        </Form>
      </Modal>
    </>
  );
};

export default GlobalEngineerHoursButton;