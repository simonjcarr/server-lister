'use client'
import { Col, Form, Input, Modal, Row, Select, Tag } from 'antd'
import { useQuery } from "@tanstack/react-query"
import { getCertificateById } from '@/app/actions/certs/crudActions'

import React from 'react'
import ClickToCopy from '../utils/ClickToCopy'
import CertStatus from './CertStatus'

// Define the certificate interface to match the actual data structure from the API
interface Certificate {
  id: number;
  status: "Pending" | "Ordered" | "Ready";
  primaryDomain: string;
  otherDomains: { domain: string }[] | null;
  requestId: string | null;
  storagePath: string | null;
  server: {
    id: number;
    hostname: string;
    ipv4: string | null;
  } | null;
  requestedBy: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

const ViewCertificateModal = ({ certId }: { certId: number }) => {
  // Only create form instance when modal is visible
  const [isModalVisible, setIsModalVisible] = React.useState(false)
  const [form] = Form.useForm()
  const [requestId, setRequestId] = React.useState<string>('')
  const [status, setStatus] = React.useState<Certificate['status']>('Pending')
  const [storagePath, setStoragePath] = React.useState<string | null>(null)
  
  const { data: cert, isLoading, error } = useQuery({ 
    queryKey: ['cert', certId],
    queryFn: async () => {
      const queryResult = await getCertificateById(certId) as unknown as Certificate

      if(queryResult) {
        const reqId = queryResult.requestId || ''
        const storPath = queryResult.storagePath || ''
        
        setRequestId(reqId)
        setStatus(queryResult.status)
        setStoragePath(storPath)
      }
      return queryResult
    }
  })
  
  // When modal becomes visible, initialize the form
  React.useEffect(() => {
    if (isModalVisible && cert) {
      form.setFieldsValue({
        requestId: cert.requestId || '',
        status: cert.status,
        storagePath: cert.storagePath || '',
      })
    }
  }, [isModalVisible, cert, form])
  
  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Ordered', label: 'Ordered' },
    { value: 'Ready', label: 'Ready' },
  ]
  
  // Handle input changes
  const handleRequestIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRequestId(value)
    form.setFieldsValue({ requestId: value })
    form.validateFields(['requestId', 'status'])
  }
  
  const handleStoragePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setStoragePath(value)
    form.setFieldsValue({ storagePath: value })
    form.validateFields(['storagePath', 'status'])
  }
  
  const handleStatusChange = (value: string) => {
    const newStatus = value as Certificate['status']
    setStatus(newStatus)
    form.setFieldsValue({ status: newStatus })
    form.validateFields(['requestId', 'storagePath', 'status'])
  }
  
  const handleOk = () => {
    form.validateFields().then(values => {
      // Handle form submission here
      console.log('Form values:', values)
      setIsModalVisible(false)
    }).catch(info => {
      console.log('Validation failed:', info)
    })
  }
  
  return (
    <>
      <div className="cursor-pointer" onClick={() => setIsModalVisible(true)}>View</div>
      <Modal title="Certificate Details" open={isModalVisible} onOk={handleOk} onCancel={() => setIsModalVisible(false)}>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          error ? (
            <div>Error: {error.message}</div>
          ) : (
            <>
              {cert && (
                <>
                  <div className='py-2 text-xl'>Status: <CertStatus status={cert.status} /></div>
                  <div className='p-2 bg-gray-800 border border-gray-900 rounded'>
                    <div className='font-semibold'>Ordered By</div>
                    <div className='flex justify-between gap-2 mb-4'>
                      <div>{cert.requestedBy?.name}</div>
                      <div className='flex'>{<ClickToCopy text={cert.requestedBy?.email || ''} />}</div>
                    </div>
                  </div>
                  <div className='p-2 bg-gray-800 border border-gray-900 rounded'>
                    <div className='font-semibold'>Server</div>
                    <div className='flex justify-between gap-2 mb-4'>
                      <div><ClickToCopy text={cert.server?.hostname || ''} /></div>
                      <div className='flex items-center'>{<ClickToCopy text={cert.server?.ipv4 || ''} />}</div>
                    </div>
                  </div>
                  <div className='p-2 bg-gray-800 border border-gray-900 rounded'>
                    <div className='font-semibold'>Hostnames</div>
                    <div className='flex items-center mb-2 gap-2'>Primary: {<ClickToCopy text={cert.primaryDomain || ''} />}</div>
                    <div className='flex items-center gap-2'>
                      Other: {cert.otherDomains && cert.otherDomains.length > 0 ? cert.otherDomains.map((d: { domain: string }) => (
                        <Tag key={d.domain}>
                          <ClickToCopy text={d.domain} />
                        </Tag>
                      )) : 'None'}
                    </div>
                  </div>
                  <div className='mt-4 px-2'>
                    <Form
                      form={form}
                    >
                    <Row className='mb-2'>
                      <Col span={12}>Request ID</Col>
                      <Col span={12}>
                      <Form.Item 
                        name="requestId" 
                        initialValue={requestId}
                        rules={[{ validator: async (_, value) => {
                          if (status !== 'Pending' && !value) {
                            throw new Error('Request ID is required');
                          }
                        }}]}
                      >
                        <Input onChange={handleRequestIdChange} />
                      </Form.Item>
                      </Col>
                    </Row>
                    <Row className='mb-2'>
                      <Col span={12}>Storage Path</Col>
                      <Col span={12}>
                      <Form.Item 
                        name="storagePath" 
                        initialValue={storagePath || ''}
                        rules={[{ validator: async (_, value) => {
                          if (status !== 'Pending' && !value) {
                            throw new Error('Storage Path is required');
                          }
                        }}]}
                      >
                        <Input onChange={handleStoragePathChange} />
                      </Form.Item>
                      </Col>
                    </Row>
                    <Row className='mb-2'>
                      <Col span={12}>Status: </Col>
                      <Col span={12}>
                      {/* status can only change from Pending if requestId and storagePath are set */}
                      <Form.Item 
                        name="status" 
                        initialValue={status}
                        rules={[{ required: true }, 
                        { validator: async (_, value) => {
                          const formValues = form.getFieldsValue();
                          const currentRequestId = formValues.requestId;
                          const currentStoragePath = formValues.storagePath;
                          
                          if (value !== 'Pending' && (!currentRequestId || !currentStoragePath)) {
                            throw new Error('Request ID and Storage Path must be set to change status to Ordered or Ready');
                          }
                          
                          if (value === 'Pending' && (currentRequestId || currentStoragePath)) {
                            throw new Error('Request ID and Storage Path must be cleared to change status to Pending');
                          }
                        }}]}
                      >
                        <Select className='w-full' onChange={(value) => handleStatusChange(value)} options={statusOptions} />
                      </Form.Item>
                      </Col>
                    </Row>
                    </Form>
                  </div>
                </>
              )}
            </>
          )
        )}
      </Modal>
    </>
  )
}

export default ViewCertificateModal