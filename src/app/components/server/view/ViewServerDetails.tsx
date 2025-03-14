import { getLocationById } from '@/app/actions/location/crudActions'
import { getServerById } from '@/app/actions/server/crudActions'
import { useQuery } from '@tanstack/react-query'
import { Alert, Card, Col, Row, Spin, Tag } from 'antd'



function ViewServerDetails({ serverId }: { serverId: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['server', serverId],
    queryFn: () => getServerById(serverId)
  })
  const { data: location, isLoading: locationLoading, error: locationError } = useQuery({
    queryKey: ['location', data?.locationId],
    queryFn: () => getLocationById(data?.locationId || 0)
  })
  return (
    <>
      {isLoading && <Spin />}
      {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
      {data && (
        <Card title={`Hostname: ${data.hostname}`} extra={data.itar && <Tag color='#ff0000' >ITAR</Tag>}>
          <Row gutter={[16, 16]}>
            <Col>
              <Card title="Server Details">
                <div className='my-4 text-gray-400'>{data.description}</div>
                <p>Hostname: {data.hostname}</p>
                <p>IPV4: {data.ipv4}</p>
                <p>IPV6: {data.ipv6}</p>
                {data.docLink && <p>Build Doc: <a href={data.docLink} target="_blank" rel="noopener noreferrer">{data.docLink}</a></p> || <p>No Build Doc</p>}
              </Card>
            </Col>
            <Col>
              {locationLoading && <Spin />}
              {locationError && <Alert message="Error" description={locationError instanceof Error ? locationError.message : 'An error occurred'} type="error" />}  
              {location && (
                <Card title={`Location: ${location.name}`}>
                  <p>{location.name}</p>
                </Card>
              )}
            </Col>
          </Row>
        </Card>
      )}
    </>
  )
}

export default ViewServerDetails