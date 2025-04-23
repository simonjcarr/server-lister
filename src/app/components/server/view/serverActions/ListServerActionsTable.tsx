'use client'
import { getServerActions } from "@/app/actions/serverActions/crudActions"
import { useQuery } from "@tanstack/react-query"
import { Table } from "antd"
import CreateNewServerActionForm from "./CreateNewServerActionForm"
import { useState } from "react"
import ViewServerAction from "./ViewServerAction"
import type { ServerAction } from "@/types"

const columns = [
  {
    title: 'Action Name',
    dataIndex: 'title',
    key: 'title',
    sorter: (a: ServerAction, b: ServerAction) => a.title.localeCompare(b.title),
  },
  {
    title: 'Created by',
    dataIndex: 'userName',
    key: 'userName',
  },
]

const ListServerActionsTable = ({ serverId }: { serverId: number }) => {
  const [selectedRow, setSelectedRow] = useState<ServerAction | null>(null)
  const [actionOpen, setActionOpen] = useState(false)
  const { data, error, isLoading } = useQuery({
    queryKey: ["serverActions", serverId],
    queryFn: () => getServerActions(serverId).then(data => data.map(item => ({ key: item.id, ...item, assignedTo: item.userId }))),
  })

  const handleRowClick = (record: ServerAction) => {
    setSelectedRow(record)
    setActionOpen(true)
  }

  const handleViewActionClose = () => {
    setActionOpen(false)
    setSelectedRow(null)
  }

  if (isLoading) return <p>Loading actions...</p>
  if (error) return <p>Error: {error instanceof Error ? error.message : 'An error occurred fetching actions'}</p>
  return (
    <div>
      <div className="text-2xl font-bold mb-4">Server Actions</div>
      
      {!actionOpen && data && data.length > 0 ? (
        <>
          <CreateNewServerActionForm serverId={serverId} />
          <Table
            columns={columns}
            dataSource={data}
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
        </>
      ) : (
        <>
          {!actionOpen && <p>No actions found for this server</p>}
        </>
      )}
      {actionOpen && selectedRow && (
        <ViewServerAction action={selectedRow} onClose={handleViewActionClose} />
      )}
    </div>
  )
}

export default ListServerActionsTable