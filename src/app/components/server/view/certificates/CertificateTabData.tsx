'use client'
import ListServerCerts from '../../certificates/ListServerCerts'
import RequestServerCertificate from '../../certificates/RequestServerCertificate'

const CertificateTabData = ({ serverId }: { serverId: number }) => {
  return (
    <>
    <div className='flex justify-end items-center mb-4'>
      <RequestServerCertificate serverId={serverId} />
    </div>
    <ListServerCerts serverId={serverId} />
    </>
  )
}

export default CertificateTabData