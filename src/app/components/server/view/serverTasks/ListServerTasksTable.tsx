'use client'
import { getServerTasks } from "@/app/actions/serverTasks/crudTasks"
import { useQuery } from "@tanstack/react-query"
import { Table } from "antd"
import CreateNewServerTaskForm from "./CreateNewServerTaskForm"
import { useState } from "react"
import ViewServerTask from "./ViewServerTask"
import type { ServerTask } from "@/types"
import { BsListTask } from "react-icons/bs";
import { FaRegCircleCheck } from "react-icons/fa6";

const columns = [
  {
    title: 'Action Name',
    dataIndex: 'title',
    key: 'title',
    sorter: (a: ServerTask, b: ServerTask) => a.title.localeCompare(b.title),
  },
  {
    title: 'Created by',
    dataIndex: 'userName',
    key: 'userName',
  },
  {
    title: 'Sub Tasks',
    dataIndex: 'subTaskCount',
    key: 'subTaskCount',
    render: (text: number) => <span className="flex items-center gap-2"><BsListTask />{text || 0}</span>,
  },
  {
    title: 'Complete',
    dataIndex: 'taskCompleteCount',
    key: 'taskCompleteCount',
    render: (text: number) => <span className="flex items-center gap-2"><FaRegCircleCheck className="text-green-500" />{text}</span>,
  },
  {
    title: 'Not Complete',
    dataIndex: 'taskNotCompleteCount',
    key: 'taskNotCompleteCount',
    render: (text: number) => <span className="flex items-center gap-2"><FaRegCircleCheck className="text-red-500" />{text}</span>,
  }
]

const ListServerTasksTable = ({ serverId }: { serverId: number }) => {
  const [selectedRow, setSelectedRow] = useState<ServerTask | null>(null)
  const [taskOpen, setTaskOpen] = useState(false)
  const { data, error, isLoading } = useQuery({
    queryKey: ["serverTasks", serverId],
    queryFn: () => getServerTasks(serverId).then(data => data.map(item => ({
      key: item.id,
      ...item,
      assignedTo: item.userId,
      // Ensure numeric types for table compatibility
      taskCount: Number(item.taskCount),
      taskCompleteCount: Number(item.taskCompleteCount),
      taskNotCompleteCount: Number(item.taskNotCompleteCount),
    }))),
  })

  const handleRowClick = (record: ServerTask) => {
    setSelectedRow(record)
    setTaskOpen(true)
  }

  const handleViewTaskClose = () => {
    setTaskOpen(false)
    setSelectedRow(null)
  }

  if (isLoading) return <p>Loading actions...</p>
  if (error) return <p>Error: {error instanceof Error ? error.message : 'An error occurred fetching actions'}</p>
  return (
    <div>
      <div className="text-2xl font-bold mb-4">Server Tasks</div>
      {!taskOpen && <CreateNewServerTaskForm serverId={serverId} />}
      {!taskOpen && data && data.length > 0 ? (
        <>

          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            size="small"
            bordered
            loading={isLoading}
            pagination={false}
            rowHoverable={true}
            rowClassName={(record) => {
              // Only apply if more than one task and complete === not complete
              if (
                record.taskCount > 1 &&
                record.taskCompleteCount === record.taskNotCompleteCount
              ) {
                return 'cursor-pointer bg-green-100'; // Tailwind green background
              }
              return 'cursor-pointer';
            }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
            })}
          />
        </>
      ) : (
        <>
          {!taskOpen && <p>No tasks found for this server</p>}
        </>
      )}
      {taskOpen && selectedRow && (
        <ViewServerTask task={selectedRow} onClose={handleViewTaskClose} />
      )}
    </div>
  )
}

export default ListServerTasksTable