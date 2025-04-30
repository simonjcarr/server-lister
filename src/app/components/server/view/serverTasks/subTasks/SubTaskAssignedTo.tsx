import React from 'react'
import { SubTask } from '@/types'
import SelectAssignedToUserModal from './SelectAssignedToUserModal'

const SubTaskAssignedTo = ({ subTask, showChangeUser = false }: { subTask: SubTask, showChangeUser?: boolean }) => {
  return (
    <div className='flex gap-2 items-center'>
      <div>Assigned To:</div>
      <div>{subTask.assignedTo || 'Not assigned'}</div>
      {showChangeUser && <SelectAssignedToUserModal subTask={subTask} />}
    </div>
  )
}

export default SubTaskAssignedTo