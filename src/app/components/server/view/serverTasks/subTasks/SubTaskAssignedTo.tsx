import React from 'react'
import { SubTask } from '@/types'
import SelectAssignedToUserModal from './SelectAssignedToUserModal'
import { FaUserEdit } from 'react-icons/fa'

const SubTaskAssignedTo = ({ subTask, showChangeUser = false, onClose }: { subTask: SubTask, showChangeUser?: boolean, onClose?: () => void }) => {
  const [showUncontrolledAssign, setShowUncontrolledAssign] = React.useState(false)

  return (
    <div className='flex gap-2 items-center'>
      <div>Assigned To:</div>
      <div>{subTask.assignedTo || 'Not assigned'}</div>
      <button onClick={() => setShowUncontrolledAssign(true)} title="Assign user" className="p-0 m-0 bg-transparent border-none cursor-pointer">
        <FaUserEdit />
      </button>
      <SelectAssignedToUserModal subTask={subTask} open={showUncontrolledAssign} onClose={() => setShowUncontrolledAssign(false)} />
      {/* Render controlled modal if showChangeUser is true */}
      {showChangeUser && <SelectAssignedToUserModal subTask={subTask} open={showChangeUser} onClose={onClose} />}
    </div>
  )
}

export default SubTaskAssignedTo