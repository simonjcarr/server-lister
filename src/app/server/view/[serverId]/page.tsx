'use client'

import { Button, Card } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { useParams } from 'next/navigation'

import ViewServerDetails from '@/app/components/server/view/ViewServerDetails'
import FormEditServer from '@/app/components/server/FormEditServer'
import ServerDetailHeader from '@/app/components/server/view/header/ServerDetailHeader'

function Page() {
  const params = useParams<{ serverId: string }>()
  const serverId = +params.serverId
  
  return (
    <Card 
      className="min-h-[90vh] w-full max-w-[1400px] mx-auto server-view-card" 
      title={<ServerDetailHeader serverId={serverId} />}
      extra={<FormEditServer serverId={serverId}><Button type="text" icon={<EditOutlined />} className="text-gray-400 hover:text-white" /></FormEditServer>}
      styles={{ 
        header: {},
        body: {}
      }}
    >
      <ViewServerDetails serverId={serverId} />
    </Card>
  )
}

export default Page