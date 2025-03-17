'use client'
import ViewServerDetails from '@/app/components/server/view/ViewServerDetails'
import { Alert, Button, Card, Col, Row, Spin, } from 'antd'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getServerById } from '@/app/actions/server/crudActions'
import ViewLocation from '@/app/components/location/ViewLocation'
import ViewBusiness from '@/app/components/business/ViewBusiness'
import ViewProject from '@/app/components/project/ViewProject'

function page() {
  const params = useParams<{serverId: string}>()
  const { data: serverData, isLoading, error } = useQuery({
    queryKey: ["server", params.serverId],
    queryFn: () => getServerById(+params.serverId),
  });
  return (
    <>
      {isLoading && <Spin />}
      {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
      {serverData && (
        <Card title={`Server: ${serverData.hostname}`} extra={<Button type="primary" onClick={() => {}}>Edit</Button>}>
          <Row gutter={[16, 16]}>
            <Col>
              <ViewServerDetails serverId={+params.serverId} />
            </Col>
            <Col>
              {serverData.locationId && <ViewLocation locationId={+serverData.locationId} />}
            </Col>
            <Col>
              {serverData.business && <ViewBusiness businessId={+serverData.business} />}
            </Col>
            <Col>
              {serverData.projectId && <ViewProject projectId={+serverData.projectId} />}</Col>
          </Row>
        </Card>
      )}
    </>
  )
}

export default page