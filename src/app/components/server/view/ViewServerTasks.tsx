import ListServerTasksTable from "./serverActions/ListServerTasksTable"

const ViewServerTasks = ({ serverId }: { serverId: number }) => {
  return (
    <ListServerTasksTable serverId={serverId} />
  )
}

export default ViewServerTasks