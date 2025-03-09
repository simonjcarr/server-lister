// Create a location form based on the location schema
"use client";

import { useState } from "react";
import { Button, Card, Form, Input, message, Typography } from "antd";
import { addLocation } from "@/app/actions/location/crudActions";
import type { InsertLocation } from "@/db/schema";

const { TextArea } = Input;
const { Title, Text } = Typography;

export default function FormAddLocation() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Handle form submission
  async function onFinish(values: InsertLocation) {
    try {
      setLoading(true);
      // Submit to server action
      const result = await addLocation(values);
      
      if (result.success) {
        message.success("Location has been created successfully");
        form.resetFields();
      } else {
        message.error("Failed to create location");
      }
    } catch (error) {
      console.error("Error creating location:", error);
      message.error("An unexpected error occurred while creating the location");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Add New Location" extra={<Text type="secondary">Create a new location for your servers</Text>}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
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
        >
          <Input placeholder="Enter location name" />
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
          >
            <Input placeholder="Contact person" />
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
          >
            <Input placeholder="contact@example.com" />
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
          >
            <Input placeholder="+1 (555) 123-4567" />
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
          >
            <Input placeholder="Physical address" />
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
        >
          <TextArea 
            placeholder="Add details about this location" 
            rows={4}
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
          >
            <Input placeholder="e.g. 40.7128" />
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
          >
            <Input placeholder="e.g. -74.0060" />
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
