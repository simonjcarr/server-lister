import { SubTask } from '@/types'
import { Switch } from 'antd'
import React from 'react'
import { toggleSubTaskComplete } from '@/app/actions/serverTasks/crudSubTasks'
import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import SubTaskAssignedTo from './SubTaskAssignedTo'

const DisplaySubTaskDetail = ({ subTask }: { subTask: SubTask }) => {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: toggleSubTaskComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subTasks", subTask.taskId] })
    }
  })

  const handleToggleComplete = () => {
    mutation.mutate(subTask.id)
  }

  return (
    <div className='px-4'>
      <div className="flex justify-between mb-2">
        <div className="text-xl font-bold">{subTask.title}</div>
        <div className='flex gap-2 items-center'>
          <div>{subTask.isComplete ? <span className="text-green-500 text-lg">Task complete</span> : 'Task Open'}</div>
          <Switch
            className="text-green-500"
            checked={subTask.isComplete}
            onChange={handleToggleComplete}
          />
        </div>
      </div>
      <SubTaskAssignedTo subTask={subTask} showChangeUser={true} />
      <div className='mt-2 whitespace-pre-wrap break-words'>{subTask.description}</div>
    </div>
  )
}

export default DisplaySubTaskDetail