import React from 'react'
import { Tabs } from 'antd'
import DisplaySubTaskDetail from './DisplaySubTaskDetail'
import type { SubTask } from '@/types'
import SubTaskComments from './comments/SubTaskComments'

const SubTaskDetailTabs = ({ subTask }: { subTask: SubTask }) => {
  const items = [
    {
      key: 'details',
      label: 'Details',
      children: <DisplaySubTaskDetail subTask={subTask} />,
    },
    {
      key: 'comments',
      label: 'Comments',
      children: <SubTaskComments subTaskId={subTask.id} />,
    },
  ]
  return <Tabs items={items} />
}

export default SubTaskDetailTabs