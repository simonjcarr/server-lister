'use client'
import { Button, Form, Input, Modal, Select, message } from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { useState } from "react"
import type { CertRequest, InsertCert } from "@/db/schema"
import TextArea from "antd/es/input/TextArea"
import { isValidHostname } from "@/app/utils/hostname"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCertRequest } from "@/app/actions/certs/crudActions"

// Define a type for the form data with otherDomains as string[]  
type CertFormData = Omit<InsertCert, 'otherDomains'> & {
  otherDomains?: string[];
}

const RequestServerCertificate = ({ serverId }: { serverId: number }) => {
  const [messageApi, contextHolder] = message.useMessage()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm<CertFormData>()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (cert: CertRequest) => createCertRequest(cert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["certs", serverId] })
      messageApi.success("Certificate requested successfully", 5)
    },
    onError: (error) => {
      messageApi.error("Failed to request certificate: " + error.message, 5)
    }
  })
  const handleOK = async () => {
    try {
      await form.validateFields()
      const formValues = form.getFieldsValue()
      console.log(formValues)
      // Transform otherDomains from string[] to {domain: string}[] if it exists
      const cert: CertRequest = {
        ...formValues,
        otherDomains: formValues.otherDomains ? 
          formValues.otherDomains.map((domain: string) => ({ domain })) : 
          undefined,
      }
      
      mutation.mutate(cert)
      form.resetFields()
      setIsModalOpen(false)
    } catch {
      messageApi.error("Please correct the form errors", 5)
    }
  }

  return (
    <>
      {contextHolder}
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
        onOk={handleOK}
        
      >
        <Form
          form={form}
          layout="vertical"
          size="small"
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }, { min: 5, message: "Name must be at least 5 characters" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" >
            <TextArea />
          </Form.Item>
          <Form.Item
            name="primaryDomain"
            label="Primary Domain"
            rules={[
              { required: true },
              {
                validator: async (_, value) => {
                  if (!value) return Promise.reject()
                  const isValid = await isValidHostname(value)
                  if (!isValid) {
                    return Promise.reject("Invalid hostname")
                  }
                  return Promise.resolve()
                }
              }
            ]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="otherDomains"
            label="Other Domains"
            rules={[
              {
                validator: async (_, value) => {
                  const results = await Promise.all(value.map(async (host: string) => {
                    const isValid = await isValidHostname(host)
                    if (!isValid) {
                      return Promise.reject("Invalid hostname")
                    }
                    return Promise.resolve()
                  }))
                  if (results.some((result) => result instanceof Error)) {
                    return Promise.reject("Invalid hostname")
                  }
                  return Promise.resolve()
                }
              }
            ]}>
            <Select mode="tags" />
          </Form.Item>

        </Form>

      </Modal>
    </>
  )
}

export default RequestServerCertificate