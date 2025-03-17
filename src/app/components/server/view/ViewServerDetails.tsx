import { getLocationById } from '@/app/actions/location/crudActions'
import { getServerById } from '@/app/actions/server/crudActions'
import { useQuery } from '@tanstack/react-query'
import { Alert, Card, Col, Row, Spin, Tag } from 'antd'
import { CopyOutlined } from '@ant-design/icons';
import ClickToCopy from '../../utils/ClickToCopy';

function ViewServerDetails({ serverId }: { serverId: number }) {
  const { data: serverData, isLoading, error } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => getServerById(serverId),
  });
  const { data: locationData, isLoading: locationLoading, error: locationError } = useQuery({
    queryKey: ["location", serverData?.locationId],
    queryFn: () => serverData?.locationId ? getLocationById(serverData!.locationId) : null,
    enabled: !!serverData?.locationId,
  });

  return (
    <>
      {isLoading && <Spin />}
      {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
      {serverData && (
        <Card title="Server Details" extra={serverData.itar && <Tag color='#ff0000' >ITAR</Tag>}>
          <div className='my-4 text-gray-400'>{serverData.description}</div>
          <p>
            Hostname: 
            <ClickToCopy text={serverData.hostname ?? ''} />
          </p>
          <p>
            IPV4: 
            <ClickToCopy text={serverData.ipv4 ?? ''} />
          </p>
          <p>
            IPV6: 
            <ClickToCopy text={serverData.ipv6 ?? ''} />
          </p>
          {serverData.docLink && <p>Build Doc: <a href={serverData.docLink} target="_blank" rel="noopener noreferrer">{serverData.docLink}</a></p> || <p>No Build Doc</p>}
        </Card>
      )
      }
    </>
  )
}

export default ViewServerDetails