'use client'
import { getServerActions } from "@/app/actions/serverActions/crudActions"
import { useQuery } from "@tanstack/react-query"
import { Table } from "antd"
import CreateNewServerActionForm from "./CreateNewServerActionForm"
import { useState } from "react"

// Define the type for a server action row
export type ServerAction = {
  id: number;
  title: string;
  assignedTo: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
  key: number;
  // Add other fields as needed
};

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
  const { data, error, isLoading } = useQuery({
    queryKey: ["serverActions", serverId],
    queryFn: () => getServerActions(serverId).then(data => data.map(item => ({ key: item.id, ...item, assignedTo: item.userId }))),
  })

  if (isLoading) return <p>Loading actions...</p>
  if (error) return <p>Error: {error instanceof Error ? error.message : 'An error occurred fetching actions'}</p>
  return (
    <div>
      <div className="text-2xl font-bold mb-4">Server Actions</div>
      <CreateNewServerActionForm serverId={serverId} />
      {data && data.length > 0 ? (
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
            onClick: () => setSelectedRow(record),
          })}
        />
      ) : (
        <p>No actions found for this server</p>
      )}
      {selectedRow && selectedRow.title}
    </div>
  )
}

export default ListServerActionsTable