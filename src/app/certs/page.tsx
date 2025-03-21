import { Card } from 'antd'
import React from 'react'
import ListAllCertificates from '../components/certs/ListAllCertificates'

const Page = () => {
  return (
    <Card title="Manage Certificates">
      <ListAllCertificates />
    </Card>
  )
}

export default Page