'use client'
import RequestServerCertificate from '../../certificates/RequestServerCertificate'

const CertificateTabData = ({ serverId }: { serverId: number }) => {
  return (
    <>
    <div className='flex justify-between items-center'>
      <h1>Certificate Tab Data</h1>
      <RequestServerCertificate serverId={serverId} />
    </div>
    </>
  )
}

export default CertificateTabData