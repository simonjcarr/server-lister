import { getServerById } from '@/app/actions/server/crudActions'
import { useQuery } from '@tanstack/react-query'
import { Alert, Card, Spin, Tag } from 'antd'



function ViewServerDetails({ serverId }: { serverId: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['server', serverId],
    queryFn: () => getServerById(serverId)
  })
  return (
    <>
    {isLoading && <Spin />}
    {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
    {data && (
        <Card title={data.hostname} extra={ data.itar && <Tag color='#ff0000' >ITAR</Tag> }>
        <div className='my-4 text-gray-400'>{data.description}</div>
        <p>Hostname: {data.hostname}</p>
        <p>IPV4: {data.ipv4}</p>
        <p>IPV6: {data.ipv6}</p>
        <p>Build Doc: <a href={data.docLink} target="_blank" rel="noopener noreferrer">{data.docLink}</a></p>
      </Card>
    )}
    </>
  )
}

export default ViewServerDetails