'use client'
// import type { ServerTask } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { getServerSubTasks } from '@/app/actions/serverTasks/crudSubTasks'
import { List, Splitter } from 'antd'
import { useEffect, useState } from 'react'
import { SubTask } from '@/types'
import DisplaySubTaskDetail from './DisplaySubTaskDetail'
import SubTaskCompleteIcon from './SubTaskCompleteIcon'


const SubTaskList = ({ taskId }: { taskId: number }) => {
  const [selectedSubTask, setSelectedSubTask] = useState<SubTask | null>(null)

  const { data: subTaskData, isLoading: subTaskLoading } = useQuery({
    queryKey: ["subTasks", taskId],
    queryFn: () => getServerSubTasks(taskId).then(data => data.map(item => ({
      key: item.sub_tasks.id,
      ...item.sub_tasks,
      assignedTo: item.user?.name,
    }))),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000 // 10 minutes
  })

  useEffect(() => {
    const tempSubTask = subTaskData?.find((subTask) => subTask.id == selectedSubTask?.id)
    if(tempSubTask) {
      setSelectedSubTask(tempSubTask)
    }
  }, [subTaskData, selectedSubTask?.id])

  return (
    <div>
      <div className="text-2xl font-bold mb-4">Sub Tasks</div>
      {subTaskLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          {!subTaskData && <p>No sub tasks found</p>}
          <Splitter>
            <Splitter.Panel defaultSize="20%">
              <List size='small'>
                {subTaskData?.map((subTask) => (
                  <List.Item key={subTask.id} onClick={() => setSelectedSubTask(subTask)}>
                    <div>
                      <span className="whitespace-nowrap block flex gap-2 items-center" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <SubTaskCompleteIcon subTask={subTask} />
                        <span className={subTask.isComplete ? "text-gray-500" : ""}>{subTask.title}</span>
                      </span>
                      <span className="block text-xs text-gray-500">{subTask.assignedTo ? <span className="text-green-400 opacity-50">Assigned: {subTask.assignedTo}</span> : <span className="text-orange-400 opacity-50">Not Assigned</span>}</span>
                    </div>
                  </List.Item>
                ))}
              </List>
            </Splitter.Panel>
            <Splitter.Panel defaultSize="80%">
              <div className=''>
                {selectedSubTask && (
                  <DisplaySubTaskDetail subTask={selectedSubTask} />
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