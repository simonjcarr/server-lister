import React from 'react'
import { Tabs } from 'antd'
import DisplaySubTaskDetail from './DisplaySubTaskDetail'
import type { SubTask } from '@/types'

const SubTaskDetailTabs = ({ subTask }: { subTask: SubTask }) => {
  return (
    <Tabs>
      <Tabs.TabPane tab="Details" key="details">
        <DisplaySubTaskDetail subTask={subTask} />
      </Tabs.TabPane>
      <Tabs.TabPane tab="Comments" key="comments"></Tabs.TabPane>
    </Tabs>
  )
}

export default SubTaskDetailTabs