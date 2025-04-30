'use client'
// import type { ServerTask } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { getServerSubTasks } from '@/app/actions/serverTasks/crudSubTasks'
import { getServerTasks } from '@/app/actions/serverTasks/crudTasks'
import { List, Splitter } from 'antd'
import { useState } from 'react'
import { SubTask } from '@/types'




const SubTaskList = ({ taskId }: { taskId: number }) => {
  const [selectedSubTask, setSelectedSubTask] = useState<SubTask | null>(null)
  const { data: taskData, isLoading: taskLoading } = useQuery({
    queryKey: ["tasks", taskId],
    queryFn: () => getServerTasks(taskId).then(data => data.map(item => ({
      key: item.id,
      ...item,
      assignedTo: item.userId,
    }))),
  })
  const { data: subTaskData, isLoading: subTaskLoading } = useQuery({
    queryKey: ["subTasks", taskId],
    queryFn: () => getServerSubTasks(taskId).then(data => data.map(item => ({
      key: item.id,
      ...item,
      assignedTo: item.assignedTo,
    }))),
  })

  return (
    <div>
      <div className="text-2xl font-bold mb-4">Sub Tasks</div>
      {taskLoading || subTaskLoading ? (
        <p>Loading...</p>
      ) : (
        <>
        { !subTaskData && <p>No sub tasks found</p>}
        <Splitter>
          <Splitter.Panel defaultSize="20%">
            <List size='small'>
              {subTaskData?.map((subTask) => (
                <List.Item style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }} key={subTask.id} onClick={() => setSelectedSubTask(subTask)}>
                  {subTask.title}
                </List.Item>
              ))}
            </List>
          </Splitter.Panel>
          <Splitter.Panel defaultSize="80%">
            <div className=''>
              {selectedSubTask && (
                <div className='px-4'>
                  <div className="text-xl font-bold">{selectedSubTask.title}</div>
                  <div>{selectedSubTask.description}</div>
                </div>
              )}
            </div>
          </Splitter.Panel>
        </Splitter>
        </>
      )}
    </div>
  )
}

export default SubTaskList