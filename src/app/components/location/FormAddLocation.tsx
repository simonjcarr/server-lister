// Create a location form based on the location schema
"use client";

import { useState } from "react";
import { Button, Card, Form, Input, notification, Typography } from "antd";
import { addLocation } from "@/app/actions/location/crudActions";
import type { InsertLocation } from "@/db/schema";

const { TextArea } = Input;
const { Text } = Typography;

export default function FormAddLocation() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = notification.useNotification();

  // Handle form submission
  async function onFinish(values: InsertLocation) {
    try {
      setLoading(true);
      // Submit to server action
      const result = await addLocation(values);
      
      if (result.success) {
        messageApi.success({
          message: "Created",
          description: "Location has been created successfully",
          duration: 3,
        });
        form.resetFields();
      } else {
        messageApi.error({
          message: "Failed",
          description: "Failed to create location",
          duration: 3,
        });
      }
    } catch (error) {
      console.error("Error creating location:", error);
      messageApi.error({
        message: "Failed",
        description: "An unexpected error occurred while creating the location",
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card 
      title="Add New Location" 
      extra={<Text type="secondary" className="dark:text-gray-300">Create a new server location</Text>}
      className="dark:bg-gray-800 dark:border-gray-700"
      headStyle={{ color: 'inherit' }}
      styles={{ body: { color: 'inherit' } }}
    >
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        className="dark:text-white"
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[
            {
              required: true,
              message: "Please enter a location name",
            },
            {
              min: 2,
              message: "Name must be at least 2 characters",
            },
            {
              max: 100,
              message: "Name must not exceed 100 characters",
            },
          ]}
          className="dark:text-white"
        >
          <Input placeholder="Enter location name" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
        </Form.Item>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Form.Item
            name="contactName"
            label="Contact Name"
            rules={[
              {
                max: 100,
                message: "Contact name must not exceed 100 characters",
              },
            ]}
            className="dark:text-white"
          >
            <Input placeholder="Contact person" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
          </Form.Item>

          <Form.Item
            name="contactEmail"
            label="Contact Email"
            rules={[
              {
                type: "email",
                message: "Please enter a valid email address",
              },
            ]}
            className="dark:text-white"
          >
            <Input placeholder="contact@example.com" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
          </Form.Item>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Form.Item
            name="contactPhone"
            label="Contact Phone"
            rules={[
              {
                max: 20,
                message: "Contact phone must not exceed 20 characters",
              },
            ]}
            className="dark:text-white"
          >
            <Input placeholder="e.g. 07123456789" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[
              {
                max: 200,
                message: "Address must not exceed 200 characters",
              },
            ]}
            className="dark:text-white"
          >
            <Input placeholder="Physical address" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
          </Form.Item>
        </div>

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
          <TextArea 
            placeholder="Add details about this location" 
            rows={4}
            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </Form.Item>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Form.Item
            name="latitude"
            label="Latitude"
            rules={[
              {
                max: 20,
                message: "Latitude must not exceed 20 characters",
              },
            ]}
            className="dark:text-white"
          >
            <Input placeholder="e.g. 40.7128" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
          </Form.Item>

          <Form.Item
            name="longitude"
            label="Longitude"
            rules={[
              {
                max: 20,
                message: "Longitude must not exceed 20 characters",
              },
            ]}
            className="dark:text-white"
          >
            <Input placeholder="e.g. -74.0060" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
          </Form.Item>
        </div>

        <Form.Item style={{ textAlign: "right" }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Location
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
