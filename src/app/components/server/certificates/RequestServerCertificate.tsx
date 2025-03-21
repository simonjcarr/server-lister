'use client'
import { Button, Modal, Form, Input } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { useState } from "react"
import { z } from "zod"

const serverCertificateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  primaryDomain: z.string().min(1, "Primary domain is required"),
  otherDomains: z.array(z.string()).optional().default([])
})

type ServerCertificateFormValues = z.infer<typeof serverCertificateSchema>

const RequestServerCertificate = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm<ServerCertificateFormValues>()

  const handleSubmit = async (values: ServerCertificateFormValues) => {
    try {
      // Validate with zod schema
      const validatedData = serverCertificateSchema.parse(values)
      console.log(validatedData)
      setIsModalOpen(false)
      form.resetFields()
    } catch (error) {
      console.error("Validation error:", error)
    }
  }

  return (
    <>
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        onClick={() => setIsModalOpen(true)}
      >
        Request Certificate
      </Button>
      
      <Modal 
        title="Request Server Certificate" 
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            name: "",
            description: "",
            primaryDomain: "",
            otherDomains: []
          }}
        >
          <Form.Item 
            name="name" 
            label="Name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item 
            name="description" 
            label="Description"
          >
            <Input />
          </Form.Item>
          
          <Form.Item 
            name="primaryDomain" 
            label="Primary Domain"
            rules={[{ required: true, message: "Please enter a primary domain" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default RequestServerCertificate