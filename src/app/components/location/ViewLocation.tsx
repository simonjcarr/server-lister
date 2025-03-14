
import { Alert, Card, Spin } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getLocationById } from '@/app/actions/location/crudActions'

function ViewLocation({ locationId }: { locationId: number }) {
  const { data: locationData, isLoading, error } = useQuery({
    queryKey: ["location", locationId],
    queryFn: () => getLocationById(locationId),
    enabled: !!locationId,
  });
  return (
    <Card title={`Location: ${locationData?.name}`}>
      {isLoading && <Spin />}
      {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
      {locationData && (
        <div className='flex flex-col gap-2'>
          <div className='text-gray-400'>{locationData.description || 'No description'}</div>
          <div>Address: {locationData.address}</div>
          <div>Latitude: {locationData.latitude || 'No latitude'}</div>
          <div>Longitude: {locationData.longitude || 'No longitude'}</div>
        </div>
      )}
    </Card>
  )
}

export default ViewLocation