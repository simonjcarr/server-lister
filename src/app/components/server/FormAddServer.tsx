'use client';

import { Card, Form, Input, Button, Select, Switch, Row, Col, Drawer, message } from 'antd'
import React, { useState } from 'react'
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query'
import { getOS } from '@/app/actions/os/crudActions';
import { InsertServer } from '@/db/schema';
const { TextArea } = Input;
import { addServer } from '@/app/actions/server/crudActions';
import { getIP } from '@/app/actions/utils/getIP';
import { getLocations } from '@/app/actions/location/crudActions';
import { getBusinesses } from '@/app/actions/business/crudActions';
import { getProjects } from '@/app/actions/projects/crudActions';

function FormAddServer({ children }: { children: React.ReactNode }) {
  const [messageApi, contextHolder] = message.useMessage();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const queryClient = useQueryClient();

  // Fetch OS list
  const { data: osList = [], isLoading: isLoadingOS } = useQuery({
    queryKey: ['os'],
    queryFn: () => getOS(),
  });

  // Fetch locations
  const { data: locationList = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => getLocations(),
  });

  // Fetch businesses
  const { data: businessList = [], isLoading: isLoadingBusinesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const result = await getBusinesses();
      if (result) {
        return result.map(item => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString()
        }));
      }
      return [];
    },
  });

  // Fetch projects
  const { data: projectList = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const result = await getProjects();
      if (result) {
        return result.map(project => ({
          ...project,
          description: project.description === null ? undefined : project.description,
          business: project.business === null ? undefined : project.business,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString()
        }));
      }
      return [];
    },
  });

  // Server creation mutation
  const serverMutation = useMutation({
    mutationFn: (values: InsertServer) => addServer(values),
    onSuccess: (result) => {
      if (result.success) {
        messageApi.success("Server Created");
        queryClient.invalidateQueries({ queryKey: ["server"] });
        form.resetFields();
      } else {
        messageApi.error("Failed to create server");
      }
    },
    onError: (error: unknown) => {
      console.error("Error creating server:", error);
      messageApi.error("An unexpected error occurred while creating the server");
    },
  });

  const onFinish = (values: InsertServer) => {
    // Convert boolean values to 0 or 1 if needed
    const formattedValues = { ...values };
    serverMutation.mutate(formattedValues);
  };

  // Get IP address mutation
  const ipMutation = useMutation({
    mutationFn: (hostname: string) => getIP(hostname),
    onSuccess: (result) => {
      if (result?.ip) {
        form.setFieldsValue({
          ipv4: result.ip
        });
      } else {
        form.setFieldsValue({
          ipv4: ""
        });
      }
    },
    onError: (error: unknown) => {
      console.error("Error fetching IP:", error);
      form.setFieldsValue({
        ipv4: ""
      });
    },
  });

  const handleHostnameChange = (value: string) => {
    if (value) {
      ipMutation.mutate(value);
    }
  };
  return (
    <>
      {contextHolder}
      <span onClick={() => setOpen(true)}>{children}</span>
      <Drawer title="Add Server" placement="right" width={400} open={open} onClose={() => setOpen(false)}>
        <Card
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
                suffix={ipMutation.isPending ? <span>Loading...</span> : null}
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

                {isLoadingOS ? <div>Loading...</div> : <Form.Item
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
                </Form.Item>}

              </Col>
              <Col span={12}>
                {isLoadingLocations ? <div>Loading...</div> : <Form.Item
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
                </Form.Item>}
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                {isLoadingBusinesses ? <div>Loading...</div> : <Form.Item
                  name="businessId"
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
                </Form.Item>}
              </Col>
              <Col span={12}>
                {isLoadingProjects ? <div>Loading...</div> : <Form.Item
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
                </Form.Item>}
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
              <Button type="primary" htmlType="submit" loading={serverMutation.isPending}>Add Server</Button>
            </Form.Item>
          </Form>
        </Card>
      </Drawer>
    </>
  )
}

export default FormAddServer
