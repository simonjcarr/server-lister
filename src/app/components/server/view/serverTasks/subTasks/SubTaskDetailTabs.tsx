import React from 'react'
import { Tabs } from 'antd'
import DisplaySubTaskDetail from './DisplaySubTaskDetail'
import type { SubTask } from '@/types'

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
      children: null,
    },
  ]
  return <Tabs items={items} />
}

export default SubTaskDetailTabs