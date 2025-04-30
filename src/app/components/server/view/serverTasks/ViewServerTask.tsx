'use client'
import { Button, Card } from 'antd'
import React from 'react'
import { IoMdArrowRoundBack } from 'react-icons/io'
import type { ServerTask } from "@/types"
import ServerTaskDetail from './ServerTaskDetail'

import SubTaskList from './subTasks/SubTaskList'
import CreateServerSubTaskForm from './subTasks/CreateServerSubTaskForm'

const ViewServerTask = ({ task, onClose }: { task: ServerTask, onClose: () => void }) => {
  return (
    <div>
      <Card className='w-full' title={
        <div className='flex gap-4'>
          <Button className='' size='small' ghost onClick={onClose}><IoMdArrowRoundBack /> Back</Button>
          <div className='font-semibold'>{task.title}</div>
        </div>
      }>
        <ServerTaskDetail task={task} />
      </Card>
      <div className='mt-4'>
        <Card title={<span className="flex justify-between">
          <div className='font-semibold'>Sub Tasks</div>
          <CreateServerSubTaskForm taskId={task.id} />
        </span>}>
          <SubTaskList taskId={task.id} />
        </Card>
      </div>
    </div>
  )
}

export default ViewServerTask