'use client'
import { Modal } from 'antd'
import { useQuery } from "@tanstack/react-query"
import { getCertificateById } from '@/app/actions/certs/crudActions'

import React from 'react'
import ClickToCopy from '../utils/ClickToCopy'

const ViewCertificateModal = ({ certId }: { certId: number }) => {
  const { data: cert, isLoading, error } = useQuery({
    queryKey: ['cert', certId],
    queryFn: () => getCertificateById(certId)
  })
  const [isModalVisible, setIsModalVisible] = React.useState(false)
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
              <div className='font-semibold'>Ordered By</div>
              <div className='flex justify-between gap-2 mb-4'>
                <div>{cert?.requestedBy?.name}</div> 
                <div className='flex'>{<ClickToCopy text={cert?.requestedBy?.email || ''} />}</div>
              </div>
              <div className='font-semibold'>Server</div>
              <div className='flex justify-between gap-2 mb-4'>
                <div>Server: <ClickToCopy text={cert?.server?.hostname || ''} /></div>
                <div className='flex items-center'>{<ClickToCopy text={cert?.server?.ipv4 || ''} />}</div>
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