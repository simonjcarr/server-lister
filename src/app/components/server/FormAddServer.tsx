'use client';

import { Card, Form, Input, Button, notification, Typography, Select, Switch, Row, Col } from 'antd'
import React, { useEffect, useState } from 'react'
import { getOS } from '@/app/actions/os/curdActions';
import { InsertLocation, InsertOS } from '@/db/schema';
const { TextArea } = Input;
const { Text } = Typography;
import { addServer } from '@/app/actions/server/crudActions';
import { getIP } from '@/app/actions/utils/getIP';
import { getLocations } from '@/app/actions/location/crudActions';

function FormAddServer() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = notification.useNotification();
  const [osList, setOsList] = useState<InsertOS[]>([]);
  const [locationList, setLocationList] = useState<InsertLocation[]>([]);
  const [formSubmitStatus, setFormSubmitStatus] = useState<{ status: 'idle' | 'success' | 'error', message?: string }>({ status: 'idle' });


  useEffect(() => {
    const fetchOS = async () => {
      const osList = await getOS();
      setOsList(osList);
    };
    const fetchLocation = async () => {
      const locationList = await getLocations();
      setLocationList(locationList);
    };
    fetchOS();
    fetchLocation();
  }, []);

  // Handle notifications based on form submission status
  useEffect(() => {
    if (formSubmitStatus.status === 'success') {
      messageApi.success({
        message: "Created",
        description: "Server has been created successfully",
        duration: 3,
      });
    } else if (formSubmitStatus.status === 'error') {
      messageApi.error({
        message: "Failed",
        description: formSubmitStatus.message || "Failed to create server",
        duration: 3,
      });
    }
  }, [formSubmitStatus, messageApi]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      // Submit to server action
      const result = await addServer(values);

      if (result.success) {
        setFormSubmitStatus({ status: 'success' });
        form.resetFields();
      } else {
        setFormSubmitStatus({ status: 'error', message: "Failed to create server" });
      }
    } catch (error) {
      console.error("Error creating server:", error);
      setFormSubmitStatus({ status: 'error', message: "An unexpected error occurred while creating the server" });
    } finally {
      setLoading(false);
    }
  };

  const handleHostnameChange = async (value: string) => {
    try {
      const result = await getIP(value);
      if (result?.ip) {
        form.setFieldsValue({
          ipv4: result.ip
        });
      } else {
        form.setFieldsValue({
          ipv4: ""
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
        locationId: null,
        osId: null,
        description: "",
        itar: false,
        secureServer: false,
      }}>
        <Form.Item name="hostname" label="Hostname" rules={[
          {
            required: true,
            message: "Please enter a hostname",
          },
        ]}>
          <Input onChange={(e) => handleHostnameChange(e.target.value)} />
        </Form.Item>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item name="ipv4" label="IPv4" rules={[
              {
                required: false,
                message: "Please enter an IPv4 address",
              },
            ]}>
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="ipv6" label="IPv6" rules={[
              {
                required: false,
                message: "Please enter an IPv6 address",
              },
            ]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col span={12}>
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
          </Col>
          <Col span={12}>
            <Form.Item name="locationId" label="Location" rules={[
              {
                required: true,
                message: "Please select a location",
              },
            ]}>
              <Select
                placeholder="Select a location"
                style={{ width: "100%" }}
              >
                {locationList.map(location => (
                  <Select.Option key={location.id} value={location.id}>
                    {location.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Description" rules={[
          {
            max: 500,
            message: "Description must not exceed 500 characters",
          },
        ]}>
          <TextArea />
        </Form.Item>

        <Row gutter={[16, 16]}>
          <Col>
            <Form.Item name="itar" label="ITAR" rules={[
              {
                required: true,
                message: "Please select an ITAR status",
              },
            ]}>
              <Switch />
            </Form.Item>
          </Col>
          <Col>
            <Form.Item name="secureServer" label="Secure Server" rules={[
              {
                required: true,
                message: "Please select a secure server status",
              },
            ]}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="docLink" label="Documentation Link" rules={[
          {
            max: 500,
            message: "Documentation link must not exceed 500 characters",
          },
        ]}>
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Add Server</Button>
        </Form.Item>
      </Form>
    </Card>
  )
}



export default FormAddServer
