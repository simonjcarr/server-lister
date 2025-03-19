'use client'

import { Splitter } from 'antd'
import ViewServerTabs from './ViewServerTabs'

function ViewServerDetails({ serverId }: { serverId: number }) {
  return (

    <Splitter className='max-h-[80vh]'>
      <Splitter.Panel className='h-full'>
        <div className='px-4'>

          <ViewServerTabs serverId={serverId} />
        </div>
      </Splitter.Panel>
      <Splitter.Panel className='h-full'>
        <div className='px-4'>Chat</div>
      </Splitter.Panel>
    </Splitter>

  )
}

export default ViewServerDetails