import { useState } from 'react'
import { Table } from 'antd'
import type { Task } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { getServerActionTasks } from '@/app/actions/serverActions/crudTasks'

const columns = [
  {
    title: 'Task Name',
    dataIndex: 'title',
    key: 'title',
    sorter: (a: Task, b: Task) => a.title.localeCompare(b.title),
  },
  {
    title: 'Assigned To',
    dataIndex: 'assignedTo',
    key: 'assignedTo',
  },
  {
    title: 'Status',
    dataIndex: 'isComplete',
    key: 'isComplete',
    render: (text: boolean) => (text ? 'Complete' : 'Not Complete'),
  },
]


const ListServerActionTasksTable = ({ taskId }: { taskId: number }) => {
  const [selectedRow, setSelectedRow] = useState<Task | null>(null)
  const [taskOpen, setTaskOpen] = useState(false)
  const { data, error, isLoading } = useQuery({
    queryKey: ["tasks", taskId],
    queryFn: () => getServerActionTasks(taskId).then(data => data.map(item => ({
      key: item.id,
      ...item,
      assignedTo: item.userId,
    }))),
  })
  const handleRowClick = (record: Task) => {
    setSelectedRow(record)
    setTaskOpen(true)
  }
  const handleTaskClose = () => {
    setTaskOpen(false)
    setSelectedRow(null)
  }
  return (
    <div>
      <div className="text-2xl font-bold mb-4">Action Tasks</div>
      <Table
        columns={columns}
        dataSource={data ?? []}
        rowKey="id"
        size="small"
        bordered
        loading={isLoading}
        pagination={false}
        rowHoverable={true}
        rowClassName={"cursor-pointer"}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
        })}
      />
    </div>
  )
}

export default ListServerActionTasksTable