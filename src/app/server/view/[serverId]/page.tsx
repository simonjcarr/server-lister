'use client'
import ViewServerDetails from '@/app/components/server/view/ViewServerDetails'
import { Col, Row } from 'antd'
import { useParams } from 'next/navigation'

function page() {
  const params = useParams<{serverId: string}>()
  return (
    <Row gutter={[16, 16]}>
      <Col span={8}>
        <ViewServerDetails serverId={+params.serverId} />
      </Col>
    </Row>
  )
}

export default page