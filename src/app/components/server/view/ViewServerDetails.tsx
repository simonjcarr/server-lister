'use client'

import ViewServerTabs from './ViewServerTabs'

function ViewServerDetails({ serverId }: { serverId: number }) {
  return (
    <div className='h-[calc(100vh-200px)] px-4'>
      <ViewServerTabs serverId={serverId} />
    </div>
  )
}

export default ViewServerDetails