import { Button, Card } from 'antd'
import React from 'react'
import { IoMdArrowRoundBack } from 'react-icons/io'
import type { ServerAction } from "@/types"
import ServerActionDetail from './ServerActionDetail'

const ViewServerTasks = ({ action, onClose }: { action: ServerAction, onClose: () => void }) => {
  return (
    <div>
      <Card className='w-full' title={
        <div className='flex gap-4'>
          <Button className='' size='small' ghost onClick={onClose}><IoMdArrowRoundBack /> Back</Button>
          <div className='font-semibold'>{action.title}</div>
        </div>
      }>
        <ServerActionDetail action={action} />
      </Card>
      <div className='mt-4'>
        <Card title="Sub Tasks">
          
        </Card>
      </div>
    </div>
  )
}

export default ViewServerTasks