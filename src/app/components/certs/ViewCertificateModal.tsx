'use client'
import { Col, Input, Modal, Row, Select, Tag } from 'antd'
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
  const [requestId, setRequestId] = React.useState<string>('')
  const [status, setStatus] = React.useState<Certificate['status']>('Pending')
  const [storagePath, setStoragePath] = React.useState<string | null>(null)
  const { data: cert, isLoading, error } = useQuery({ 
    queryKey: ['cert', certId],
    queryFn: async () => {
      const queryResult = await getCertificateById(certId) as unknown as Certificate

      if(queryResult) {
        setRequestId(queryResult.requestId || '')
        setStatus(queryResult.status)
        setStoragePath(queryResult.storagePath)
      }
      return queryResult
    }
  })
  const [isModalVisible, setIsModalVisible] = React.useState(false)
  const handleStatusChange = (value: string) => {
    setStatus(value as Certificate['status'])
  }
  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Ordered', label: 'Ordered' },
    { value: 'Ready', label: 'Ready' },
  ]
  return (
    <>
      <div className="cursor-pointer" onClick={() => setIsModalVisible(true)}>View</div>
      <Modal title="Certificate Details" open={isModalVisible} onOk={() => setIsModalVisible(false)} onCancel={() => setIsModalVisible(false)}>
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
                    <Row className='mb-2'>
                      <Col span={12}>Request ID</Col>
                      <Col span={12}><Input value={requestId} onChange={(e) => setRequestId(e.target.value)} /></Col>
                    </Row>
                    <Row className='mb-2'>
                      <Col span={12}>Storage Path</Col>
                      <Col span={12}><Input value={storagePath || ''} onChange={(e) => setStoragePath(e.target.value)} /></Col>
                    </Row>
                    <Row className='mb-2'>
                      <Col span={12}>Status: </Col>
                      <Col span={12}><Select className='w-full' value={status} onChange={(value) => handleStatusChange(value)} options={statusOptions} /></Col>
                    </Row>
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