'use client'
import ViewServerDetails from '@/app/components/server/view/ViewServerDetails'
import { Alert, Button, Card, Col, Row, Spin, } from 'antd'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getServerById } from '@/app/actions/server/crudActions'
import ViewLocation from '@/app/components/location/ViewLocation'
import ViewBusiness from '@/app/components/business/ViewBusiness'
import ViewProject from '@/app/components/project/ViewProject'
import ViewOS from '@/app/components/os/ViewOS'
import { useRouter } from 'next/navigation'

function page() {
  const params = useParams<{serverId: string}>()
  const router = useRouter()
  const { data: serverData, isLoading, error } = useQuery({
    queryKey: ["server", params.serverId],
    queryFn: () => getServerById(+params.serverId),
  });
  return (
    <>
      {isLoading && <Spin />}
      {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
      {serverData && (
        <Card title={`Server: ${serverData.hostname}`} extra={<Button type="primary" onClick={() => {router.push(`/server/edit/${params.serverId}`)}}>Edit</Button>}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <ViewServerDetails serverId={+params.serverId} />
            </Col>
            <Col span={12}>
              {serverData.projectId && <ViewProject projectId={+serverData.projectId} />}
            </Col>
            <Col span={8}>
              {serverData.locationId && <ViewLocation locationId={+serverData.locationId} />}
            </Col>
            <Col span={8}>
              {serverData.business && <ViewBusiness businessId={+serverData.business} />}
            </Col>
            <Col span={8}>
              {serverData.osId && <ViewOS osId={+serverData.osId} />}
            </Col>
          </Row>
        </Card>
      )}
    </>
  )
}

export default page