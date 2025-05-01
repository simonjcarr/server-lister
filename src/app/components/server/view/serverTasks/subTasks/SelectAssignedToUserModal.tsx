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

const SelectAssignedToUserModal = ({ subTask }: { subTask: SubTask }) => {
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
        // Optionally, you could handle/display the error here
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
  return (
    <div>
      <Button onClick={() => setIsOpen(true)} size="small"><FaUserEdit /></Button>
      <Modal title="Change Assigned User" open={isOpen} onCancel={() => setIsOpen(false)} footer={null}>
        <Select
          style={{width: '100%'}}
          options={usersData}
          value={subTask.assignedTo || undefined}
          onChange={(value) => {
            setIsOpen(false)
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