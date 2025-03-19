'use client'

import { Alert, Button, Card, Spin, } from 'antd'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getServerById } from '@/app/actions/server/crudActions'

import ClickToCopy from '@/app/components/utils/ClickToCopy'
import { useRouter } from 'next/navigation'
import ViewServerDetails from '@/app/components/server/view/ViewServerDetails'

function Page() {
  const router = useRouter()
  const params = useParams<{ serverId: string }>()
  const { data: serverData, isLoading, error } = useQuery({
    queryKey: ["server", params.serverId],
    queryFn: () => getServerById(+params.serverId),
  });
  return (
    <Card className="min-h-[90vh] w-full" title={
      <div className='flex gap-4'>
        Server Details
        {isLoading && <Spin />}
        {error && <Alert message="Error" description={error instanceof Error ? error.message : 'An error occurred'} type="error" />}
        {serverData && (
          <div className='flex gap-4 text-gray-400'>
            <div className='flex gap-2'>Hostname: <ClickToCopy text={serverData.hostname ?? ''} /></div>
            <div className='flex gap-2'>IPV4: <ClickToCopy text={serverData.ipv4 ?? ''} /></div>
            <div className='flex gap-2'>IPV6: <ClickToCopy text={serverData.ipv6 ?? ''} /></div>
          </div>
        )}
      </div>
    } extra={
      <Button type="primary" onClick={() => { router.push(`/server/edit/${params.serverId}`) }}>Edit</Button>
    }>
      <ViewServerDetails serverId={+params.serverId} />
    </Card>
  )
}

export default Page