'use client'
// import type { ServerTask } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { reorderSubTasks, getServerSubTasks } from '@/app/actions/serverTasks'
import { List, Splitter } from 'antd'
import { useEffect, useState } from 'react'
import { SubTask } from '@/types'
import DisplaySubTaskDetail from './DisplaySubTaskDetail'
import SubTaskCompleteIcon from './SubTaskCompleteIcon'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

const SubTaskList = ({ taskId }: { taskId: number }) => {
  const [selectedSubTask, setSelectedSubTask] = useState<SubTask | null>(null)
  const [subTasks, setSubTasks] = useState<SubTask[]>([])

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
    if (subTaskData) {
      setSubTasks(subTaskData)
    }
  }, [subTaskData])

  useEffect(() => {
    const tempSubTask = subTasks?.find((subTask) => subTask.id == selectedSubTask?.id)
    if(tempSubTask) {
      setSelectedSubTask(tempSubTask)
    }
  }, [subTasks, selectedSubTask?.id])

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const reordered = Array.from(subTasks)
    const [removed] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, removed)
    setSubTasks(reordered)
    try {
      await reorderSubTasks(reordered.map(t => t.id))
    } catch (err) {
      console.error('Failed to reorder sub-tasks', err)
    }
  }

  return (
    <div>
      <div className="text-2xl font-bold mb-4">Sub Tasks</div>
      {subTaskLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          {!subTasks && <p>No sub tasks found</p>}
          <Splitter>
            <Splitter.Panel defaultSize="20%">
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="subTaskList">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      <List size='small'>
                        {subTasks?.map((subTask, index) => (
                          <Draggable key={subTask.id} draggableId={subTask.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <List.Item
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedSubTask(subTask)}
                                className={selectedSubTask?.id == subTask.id ? "bg-gray-800" : "cursor-pointer"}
                                style={{
                                  ...provided.draggableProps.style,
                                  boxShadow: snapshot.isDragging ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                  <div>
                                    <span className="whitespace-nowrap flex gap-2 items-center" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      <SubTaskCompleteIcon subTask={subTask} />
                                      <span className={subTask.isComplete ? "text-gray-500" : ""}>{subTask.title}</span>
                                    </span>
                                    <span className="block text-xs text-gray-500">{subTask.assignedTo ? <span className="text-green-400 opacity-50">Assigned: {subTask.assignedTo}</span> : <span className="text-orange-400 opacity-50">Not Assigned</span>}</span>
                                  </div>
                                </div>
                              </List.Item>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </List>
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
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