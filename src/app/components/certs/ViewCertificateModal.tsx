'use client'
import { Col, Input, Modal, Row, Select, Tag } from 'antd'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getCertificateById, updateCertificate } from '@/app/actions/certs/crudActions'
import { useSession } from 'next-auth/react'
import React from 'react'
import ClickToCopy from '../utils/ClickToCopy'
import CertStatus from './CertStatus'
import { userHasAtLeastOneRole } from '@/lib/role-utils'

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

// Create a separate inner modal component to allow unmounting the entire modal content
const CertificateModalContent = ({ 
  certId, 
  isVisible, 
  onClose, 
  onSuccess,
}: { 
  certId: number, 
  isVisible: boolean, 
  onClose: () => void, 
  onSuccess: () => void,
}) => {
  const { data: session } = useSession()
  const hasRequiredRoles = userHasAtLeastOneRole(session?.user?.roles, ['admin', 'certs'])
  
  // Form state
  const [requestId, setRequestId] = React.useState('')
  const [status, setStatus] = React.useState<Certificate['status']>('Pending')
  const [originalStatus, setOriginalStatus] = React.useState<Certificate['status']>('Pending')
  const [storagePath, setStoragePath] = React.useState('')
  const [confirmModalVisible, setConfirmModalVisible] = React.useState(false)
  
  // Form validation state
  const [formError, setFormError] = React.useState('')
  
  // Status options for the dropdown
  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Ordered', label: 'Ordered' },
    { value: 'Ready', label: 'Ready' },
  ]
  
  const { data: cert, isLoading, error } = useQuery({ 
    queryKey: ['cert', certId],
    queryFn: async () => {
      try {
        const queryResult = await getCertificateById(certId) as unknown as Certificate

        if(queryResult) {
          // Initialize the form state from the certificate data
          setRequestId(queryResult.requestId || '')
          setStatus(queryResult.status)
          setOriginalStatus(queryResult.status)
          setStoragePath(queryResult.storagePath || '')
        }
        return queryResult
      } catch (error) {
        console.error('Error fetching certificate:', error)
        throw error
      }
    },
    enabled: isVisible, // Only fetch when modal is visible
  })
  
  const mutate = useMutation({
    mutationFn: updateCertificate,
    onSuccess: () => {
      // Signal success to parent component
      onSuccess()
    },
    onError: (error) => {
      console.error('Error updating certificate:', error)
      setFormError(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  })
  
  // Handle status change with confirmation for Ready status
  const handleStatusChange = (value: Certificate['status']) => {
    // If changing from Ready to something else, show confirmation
    if (originalStatus === 'Ready' && value !== 'Ready') {
      // Store the desired new status for confirmation
      setStatus(value)
      // Show confirmation modal
      setConfirmModalVisible(true)
    } else {
      // For other status changes, just update the status
      setStatus(value)
    }
  }
  
  // Handle confirmation of status change
  const handleConfirmStatusChange = () => {
    // Close confirmation modal
    setConfirmModalVisible(false)
    // Status has already been updated in state
  }
  
  // Cancel status change
  const handleCancelStatusChange = () => {
    // Reset to original status
    setStatus(originalStatus)
    // Close confirmation modal
    setConfirmModalVisible(false)
  }
  
  // Validate the form based on the current state
  const validateForm = (): boolean => {
    if (status !== 'Pending' && (!requestId || !storagePath)) {
      setFormError('Request ID and Storage Path must be set for Ordered or Ready status')
      return false
    }
    
    if (status === 'Pending' && (requestId || storagePath)) {
      setFormError('Request ID and Storage Path must be cleared for Pending status')
      return false
    }
    
    setFormError('')
    return true
  }
  
  // Handler for the submit button
  const handleSubmit = () => {
    if (validateForm()) {
      mutate.mutate({
        id: certId,
        requestId,
        status,
        storagePath,
      })
    }
  }
  
  return (
    <>
      {/* Main Modal */}
      <Modal 
        title="Certificate Details" 
        open={isVisible} 
        onOk={handleSubmit} 
        onCancel={onClose}
        destroyOnClose={true} // Important: destroy component when closed
      >
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
                  {hasRequiredRoles && (
                    <div className='mt-4 px-2'>
                      {formError && (
                        <div className="text-red-500 mb-2">{formError}</div>
                      )}
                      <Row className='mb-2'>
                        <Col span={12}>Status: </Col>
                        <Col span={12}>
                          <Select 
                            className='w-full'
                            value={status}
                            onChange={handleStatusChange}
                            options={statusOptions}
                          />
                        </Col>
                      </Row>
                      <Row className='mb-2'>
                        <Col span={12}>Request ID</Col>
                        <Col span={12}>
                          <Input 
                            value={requestId}
                            onChange={(e) => setRequestId(e.target.value)}
                          />
                        </Col>
                      </Row>
                      <Row className='mb-2'>
                        <Col span={12}>Storage Path</Col>
                        <Col span={12}>
                          <Input 
                            value={storagePath}
                            onChange={(e) => setStoragePath(e.target.value)}
                          />
                        </Col>
                      </Row>
                    </div>
                  )}
                </>
              )}
            </>
          )
        )}
      </Modal>
      
      {/* Confirmation Modal for status change from Ready */}
      <Modal
        title="Confirm Status Change"
        open={confirmModalVisible}
        onOk={handleConfirmStatusChange}
        onCancel={handleCancelStatusChange}
        destroyOnClose={true}
      >
        <p>Are you sure you want to change the status from Ready to {status}?</p>
      </Modal>
    </>
  )
}

const ViewCertificateModal = ({ certId }: { certId: number }) => {
  const [isModalVisible, setIsModalVisible] = React.useState(false)
  const [wasSubmitted, setWasSubmitted] = React.useState(false)
  const queryClient = useQueryClient()
  
  // Handle successful submission
  const handleSuccess = () => {
    // Mark as submitted first
    setWasSubmitted(true)
    // Close the modal
    setIsModalVisible(false)
    // Update queries after a timeout
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['cert', certId] })
      queryClient.invalidateQueries({ queryKey: ['certs'] })
      // Reset submission state after data is refreshed
      setWasSubmitted(false)
    }, 200)
  }
  
  return (
    <>
      <div className="cursor-pointer" onClick={() => setIsModalVisible(true)}>View</div>
      
      {/* Only render the modal content when it's visible and wasn't just submitted */}
      {isModalVisible && !wasSubmitted && (
        <CertificateModalContent 
          certId={certId}
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}

export default ViewCertificateModal