'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Alert, Button, Space, Tooltip, App, Modal, Form, Select, Checkbox, Spin } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getServerById, updateServer, getBusinessOptions, getLocationOptions, getOSOptions, getProjectOptions } from '@/app/actions/server/crudActions'
import { ExclamationCircleOutlined, EditOutlined } from '@ant-design/icons'

interface ServerOnboardingStatusProps {
  serverId: number
}

interface ServerOnboardingFormValues {
  projectId: number;
  locationId: number;
  business: number;
  osId: number;
  itar: boolean;
  onboardingComplete?: boolean;
}

const ServerOnboardingStatus: React.FC<ServerOnboardingStatusProps> = ({ serverId }) => {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [shouldAutoSetComplete, setShouldAutoSetComplete] = useState(true)

  // Query server data to get onboarding status
  const { data: server, isLoading } = useQuery({
    queryKey: ['server', serverId],
    queryFn: () => getServerById(serverId),
    enabled: !!serverId,
  })

  // Fetch options for dropdown selects
  const { data: businessOptions = [] } = useQuery({
    queryKey: ['businessOptions'],
    queryFn: getBusinessOptions,
  })

  const { data: projectOptions = [] } = useQuery({
    queryKey: ['projectOptions'],
    queryFn: getProjectOptions,
  })

  const { data: osOptions = [] } = useQuery({
    queryKey: ['osOptions'],
    queryFn: getOSOptions,
  })

  const { data: locationOptions = [] } = useQuery({
    queryKey: ['locationOptions'],
    queryFn: getLocationOptions,
  })

  // Mutation to update server with onboarding details
  const { mutate: updateServerDetails, isPending } = useMutation({
    mutationFn: async (values: ServerOnboardingFormValues) => {
      // Include the onboarded flag in the update
      const updateData = {
        ...values,
        onboarded: values.onboardingComplete,
      }
      // Remove the onboardingComplete field as it's not in the server schema
      delete updateData.onboardingComplete
      
      const result = await updateServer(updateData, serverId)
      return result
    },
    onSuccess: () => {
      message.success('Server has been updated')
      // Invalidate server query to refresh data
      queryClient.invalidateQueries({ queryKey: ['server', serverId] })
      setModalVisible(false)
    },
    onError: () => {
      message.error('Failed to update server details')
    }
  })

  // Handle modal open
  const openOnboardingModal = () => {
    // Set initial form values from server data
    form.setFieldsValue({
      projectId: server?.projectId,
      locationId: server?.locationId,
      business: server?.business || null,
      osId: server?.osId,
      itar: server?.itar || false,
      onboardingComplete: false
    })
    setShouldAutoSetComplete(true)
    setModalVisible(true)
  }

  // Check if all required fields are filled
  const checkRequiredFields = useCallback(() => {
    try {
      const values = form.getFieldsValue()
      const requiredFields = ['projectId', 'locationId', 'business', 'osId']
      const allFilled = requiredFields.every(field => values[field] !== undefined && values[field] !== null)
      
      setOnboardingComplete(allFilled)
      
      // Only auto-set the checkbox if we haven't manually changed it yet
      if (allFilled && shouldAutoSetComplete) {
        // Use a timeout to break the circular reference
        setTimeout(() => {
          form.setFieldValue('onboardingComplete', true)
        }, 0)
      }
    } catch (error) {
      console.error('Error checking required fields:', error)
    }
  }, [form, shouldAutoSetComplete])

  // Handle form changes
  const handleFormChange = (changedValues: Partial<ServerOnboardingFormValues>) => {
    // If the onboardingComplete checkbox was manually changed, disable auto-setting
    if ('onboardingComplete' in changedValues) {
      setShouldAutoSetComplete(false)
    } else {
      // If a required field changed, check if all are filled
      checkRequiredFields()
    }
  }

  // Effect to check required fields whenever modal becomes visible
  useEffect(() => {
    if (modalVisible) {
      // Wait for the form to be fully mounted
      setTimeout(checkRequiredFields, 0)
    }
  }, [modalVisible, checkRequiredFields])

  // Handle form submission
  const handleSubmit = () => {
    form.validateFields()
      .then((values) => {
        updateServerDetails(values)
      })
      .catch((info) => {
        console.error('Validate Failed:', info)
      })
  }

  if (isLoading) return null

  // Only show if server exists and is not onboarded
  if (!server || server.onboarded) return null

  return (
    <>
      <Alert
        type="warning"
        message={
          <Space direction="vertical" className="w-full">
            <div className="flex items-center">
              <ExclamationCircleOutlined className="mr-2 text-yellow-500" />
              <span className="font-medium">This server needs to be onboarded</span>
            </div>
            <div className="text-sm">
              This server was automatically added through the scanning process and has not yet been onboarded by an engineer.
            </div>
            <div className="flex justify-end">
              <Tooltip title="Configure this server with required information">
                <Button 
                  type="primary" 
                  onClick={openOnboardingModal} 
                  icon={<EditOutlined />}
                >
                  Start Onboarding
                </Button>
              </Tooltip>
            </div>
          </Space>
        }
        className="mb-4"
      />

      <Modal
        title="Onboard Server"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="Save Changes"
        confirmLoading={isPending}
        width={600}
      >
        <Spin spinning={isPending}>
          <Form 
            form={form} 
            layout="vertical" 
            onValuesChange={handleFormChange}
          >
            <Form.Item 
              name="projectId" 
              label="Project" 
              rules={[{ required: true, message: 'Please select a project' }]}
            >
              <Select
                placeholder="Select a project"
                options={projectOptions.map(p => ({ value: p.id, label: p.name }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item 
              name="locationId" 
              label="Location" 
              rules={[{ required: true, message: 'Please select a location' }]}
            >
              <Select
                placeholder="Select a location"
                options={locationOptions.map(l => ({ value: l.id, label: l.name }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item 
              name="business" 
              label="Business" 
              rules={[{ required: true, message: 'Please select a business' }]}
            >
              <Select
                placeholder="Select a business"
                options={businessOptions.map(b => ({ value: b.id, label: b.name }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item 
              name="osId" 
              label="Operating System" 
              rules={[{ required: true, message: 'Please select an operating system' }]}
            >
              <Select
                placeholder="Select an operating system"
                options={osOptions.map(o => ({ value: o.id, label: o.name }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item name="itar" valuePropName="checked">
              <Checkbox>ITAR Controlled</Checkbox>
            </Form.Item>

            <Form.Item name="onboardingComplete" valuePropName="checked">
              <Checkbox>
                <span className={onboardingComplete ? 'text-green-600 font-medium' : ''}>
                  Onboarding Complete
                </span>
                {onboardingComplete && (
                  <span className="text-sm text-green-600 ml-2">
                    (All required fields are filled)
                  </span>
                )}
              </Checkbox>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </>
  )
}

export default ServerOnboardingStatus
