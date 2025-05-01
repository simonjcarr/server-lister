import { Button, Modal, Select } from 'antd'
import React, { useState } from 'react'
import { FaUserEdit } from 'react-icons/fa'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { getAllUsers } from '@/app/actions/users/userActions'
import type { SubTask } from '@/types'
import { updateSubTask } from '@/app/actions/serverTasks/crudSubTasks'

interface UserSelectOption {
  key: string;
  label: string | null;
  value: string;
}

interface SelectAssignedToUserModalProps {
  subTask: SubTask
  open?: boolean
  onClose?: () => void
}

const SelectAssignedToUserModal = ({ subTask, open, onClose }: SelectAssignedToUserModalProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers().then(data => {
      if (Array.isArray(data)) {
        return data.map((item): UserSelectOption => ({
          key: item.id,
          label: item.name,
          value: item.id,
        }));
      } else {
        return [];
      }
    }),
  })
  const updateSubTaskMutation = useMutation({
    mutationFn: updateSubTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subTasks", subTask.taskId] })
    }
  })

  // Determine modal open state
  const modalOpen = open !== undefined ? open : isOpen
  const handleClose = () => {
    if (onClose) onClose()
    if (open === undefined) setIsOpen(false)
  }

  return (
    <div>
      {open === undefined && (
        <Button onClick={() => setIsOpen(true)} size="small"><FaUserEdit /></Button>
      )}
      <Modal title="Change Assigned User" open={modalOpen} onCancel={handleClose} footer={null}>
        <Select
          style={{width: '100%'}}
          options={usersData}
          value={subTask.assignedTo || undefined}
          onChange={(value) => {
            handleClose()
            updateSubTaskMutation.mutate({
              subTaskId: subTask.id,
              assignedTo: value,
            })
          }}
        />
      </Modal>
    </div>
  )
}

export default SelectAssignedToUserModal