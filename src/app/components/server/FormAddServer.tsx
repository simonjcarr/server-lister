'use client';

import { Card, Form, Input, Button, notification, Typography, Select } from 'antd'
import React, { useEffect, useState } from 'react'
import { getOS } from '@/app/actions/os/curdActions';
import { InsertOS } from '@/db/schema';
const { TextArea } = Input;
const { Text } = Typography;
import { addServer } from '@/app/actions/server/crudActions';
import { getIP } from '@/app/actions/utils/getIP';

function FormAddServer() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = notification.useNotification();
  const [osList, setOsList] = useState<InsertOS[]>([]);


  useEffect(() => {
    const fetchOS = async () => {
      const osList = await getOS();
      setOsList(osList);
    };
    fetchOS();
  }, []);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      // Submit to server action
      const result = await addServer(values);

      if (result.success) {
        messageApi.success({
          message: "Created",
          description: "Server has been created successfully",
          duration: 3,
        });
        form.resetFields();
      } else {
        messageApi.error({
          message: "Failed",
          description: "Failed to create server",
          duration: 3,
        });
      }
    } catch (error) {
      console.error("Error creating server:", error);
      messageApi.error({
        message: "Failed",
        description: "An unexpected error occurred while creating the server",
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHostnameChange = async (value: string) => {
    try {
      // Trigger the API call to get IP address
      const result = await getIP(value);
      if (result?.ip) {
        form.setFieldsValue({
          ipv4: result.ip
        });
      }
    } catch (error) {
      console.error("Error fetching IP:", error);
    }
  };
  return (
    <Card title="Add Server">
      <Form form={form} onFinish={onFinish} layout="vertical" initialValues={{
        hostname: "",
        ipv4: "",
        ipv6: "",
        osId: null,
        description: "",
      }}>
        <Form.Item name="hostname" label="Hostname" rules={[
          {
            required: true,
            message: "Please enter a hostname",
          },
        ]}>
          <Input onChange={(e) => handleHostnameChange(e.target.value)} />
        </Form.Item>

        {/* When hostname changes, find the IP address using  src/app/api/getip/[hostname]/route.ts*/}

        <Form.Item name="ipv4" label="IPv4" rules={[
          {
            required: false,
            message: "Please enter an IPv4 address",
          },
        ]}>
          <Input />
        </Form.Item>

        <Form.Item name="ipv6" label="IPv6" rules={[
          {
            required: false,
            message: "Please enter an IPv6 address",
          },
        ]}>
          <Input />
        </Form.Item>
        
        <Form.Item name="osId" label="OS" rules={[
          {
            required: true,
            message: "Please select an OS",
          },
        ]}>
          <Select
            placeholder="Select an OS"
            style={{ width: "100%" }}
          >
            {osList.map(os => (
              <Select.Option key={os.id} value={os.id}>
                {os.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[
          {
            max: 500,
            message: "Description must not exceed 500 characters",
          },
        ]}>
          <TextArea />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Add Server</Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default FormAddServer
