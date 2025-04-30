import React from 'react'
import { SubTask } from '@/types'

const SubTaskAssignedTo = ({ subTask }: { subTask: SubTask }) => {
  return (
    <div>
      <div>Assigned To</div>
      <div>{subTask.assignedTo}</div>
    </div>
  )
}

export default SubTaskAssignedTo