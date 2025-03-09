'use client';

import { Card, Form, Input, Button, Typography, Select, Switch, Row, Col, App } from 'antd'
import React, { useEffect, useState } from 'react'
import { getOS } from '@/app/actions/os/curdActions';
import { InsertLocation, InsertOS } from '@/db/schema';
const { TextArea } = Input;
const { Text } = Typography;
import { addServer } from '@/app/actions/server/crudActions';
import { getIP } from '@/app/actions/utils/getIP';
import { getLocations } from '@/app/actions/location/crudActions';
import { getBusinesses } from '@/app/actions/business/crudActions';
import { getProjects } from '@/app/actions/projects/crudActions';

interface Business {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  business?: number;
  code?: string;
  createdAt: string;
  updatedAt: string;
}

function FormAddServer() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { notification } = App.useApp();
  const [osList, setOsList] = useState<InsertOS[]>([]);
  const [locationList, setLocationList] = useState<InsertLocation[]>([]);
  const [businessList, setBusinessList] = useState<Business[]>([]);
  const [projectList, setProjectList] = useState<Project[]>([]);
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
    const fetchBusinesses = async () => {
      const result = await getBusinesses();
      if (result.success && result.data) {
        setBusinessList(result.data as Business[]);
      } else {
        console.error('Error fetching businesses:', result.error);
      }
    };
    const fetchProjects = async () => {
      const result = await getProjects();
      if (result.success && result.data) {
        setProjectList(result.data as Project[]);
      } else {
        console.error('Error fetching projects:', result.error);
      }
    };
    fetchOS();
    fetchLocation();
    fetchBusinesses();
    fetchProjects();
  }, []);

  // Handle notifications based on form submission status
  useEffect(() => {
    if (formSubmitStatus.status === 'success') {
      notification.success({
        message: "Created",
        description: "Server has been created successfully",
        duration: 3,
      });
    } else if (formSubmitStatus.status === 'error') {
      notification.error({
        message: "Failed",
        description: formSubmitStatus.message || "Failed to create server",
        duration: 3,
      });
    }
  }, [formSubmitStatus, notification]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      // Convert boolean values to 0 or 1
      const formattedValues = {
        ...values,
        itar: values.itar ? 1 : 0,
        secureServer: values.secureServer ? 1 : 0
      };

      // Submit to server action
      const result = await addServer(formattedValues);

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
    <Card
      title="Add Server"
      className="dark:bg-gray-800 dark:border-gray-700"
      styles={{
        header: { color: 'inherit' },
        body: { color: 'inherit' }
      }}
    >
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        initialValues={{
          hostname: "",
          ipv4: "",
          ipv6: "",
          locationId: null,
          osId: null,
          business: null,
          projectId: null,
          description: "",
          itar: false,
          secureServer: false,
        }}
        className="dark:text-white"
      >


        <Form.Item
          name="hostname"
          label="Hostname"
          rules={[
            {
              required: true,
              message: "Please enter a hostname",
            },
          ]}
          className="dark:text-white"
        >
          <Input
            onChange={(e) => handleHostnameChange(e.target.value)}
            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </Form.Item>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="ipv4"
              label="IPv4"
              rules={[
                {
                  required: false,
                  message: "Please enter an IPv4 address",
                },
              ]}
              className="dark:text-white"
            >
              <Input className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="ipv6"
              label="IPv6"
              rules={[
                {
                  required: false,
                  message: "Please enter an IPv6 address",
                },
              ]}
              className="dark:text-white"
            >
              <Input className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="osId"
              label="OS"
              rules={[
                {
                  required: true,
                  message: "Please select an OS",
                },
              ]}
              className="dark:text-white"
            >
              <Select
                placeholder="Select an OS"
                style={{ width: "100%" }}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                dropdownStyle={{ backgroundColor: 'var(--bg-dropdown)', color: 'var(--text-dropdown)' }}
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
            <Form.Item
              name="locationId"
              label="Location"
              rules={[
                {
                  required: true,
                  message: "Please select a location",
                },
              ]}
              className="dark:text-white"
            >
              <Select
                placeholder="Select a location"
                style={{ width: "100%" }}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                dropdownStyle={{ backgroundColor: 'var(--bg-dropdown)', color: 'var(--text-dropdown)' }}
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

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="business"
              label="Business"
              rules={[
                {
                  required: true,
                  message: "Please select a business",
                },
              ]}
              className="dark:text-white"
            >
              <Select
                placeholder="Select a business"
                style={{ width: "100%" }}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                dropdownStyle={{ backgroundColor: 'var(--bg-dropdown)', color: 'var(--text-dropdown)' }}
                allowClear
              >
                {businessList.map(business => (
                  <Select.Option key={business.id} value={business.id}>
                    {business.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="projectId"
              label="Project"
              rules={[
                {
                  required: true,
                  message: "Please select a project",
                },
              ]}
              className="dark:text-white"
            >
              <Select
                placeholder="Select a project"
                style={{ width: "100%" }}
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                dropdownStyle={{ backgroundColor: 'var(--bg-dropdown)', color: 'var(--text-dropdown)' }}
              >
                {projectList.map(project => (
                  <Select.Option key={project.id} value={project.id}>
                    {project.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="docLink"
          label="Documentation Link"
          rules={[
            {
              max: 500,
              message: "Documentation link must not exceed 500 characters",
            },
          ]}
          className="dark:text-white"
        >
          <Input className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          rules={[
            {
              max: 500,
              message: "Description must not exceed 500 characters",
            },
          ]}
          className="dark:text-white"
        >
          <TextArea className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
        </Form.Item>

        <Row gutter={[16, 16]}>
          <Col>
            <Form.Item
              name="itar"
              label="ITAR"
              rules={[
                {
                  required: true,
                  message: "Please select an ITAR status",
                },
              ]}
              className="dark:text-white"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col>
            <Form.Item
              name="secureServer"
              label="Secure Server"
              rules={[
                {
                  required: true,
                  message: "Please select a secure server status",
                },
              ]}
              className="dark:text-white"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>Add Server</Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default FormAddServer
