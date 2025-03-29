'use client'

import { Splitter } from 'antd'
import ViewServerTabs from './ViewServerTabs'
import { ChatPanel } from '../../chat/ChatPanel'

function ViewServerDetails({ serverId }: { serverId: number }) {
  return (
    <Splitter className='max-h-[80vh]'>
      <Splitter.Panel className='h-full' size="70%">
        <div className='px-4'>
          <ViewServerTabs serverId={serverId} />
        </div>
      </Splitter.Panel>
      <Splitter.Panel className='h-full' size="30%">
        <div className='px-4 h-full'>
          <ChatPanel serverId={serverId} />
        </div>
      </Splitter.Panel>
    </Splitter>
  )
}

export default ViewServerDetails