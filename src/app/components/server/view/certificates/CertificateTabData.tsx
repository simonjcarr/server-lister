'use client'
import RequestServerCertificate from '../../certificates/RequestServerCertificate'

const CertificateTabData = ({ serverId }: { serverId: number }) => {
  return (
    <>
      <h1>Certificate Tab Data</h1>
      <RequestServerCertificate serverId={serverId} />
    </>
  )
}

export default CertificateTabData