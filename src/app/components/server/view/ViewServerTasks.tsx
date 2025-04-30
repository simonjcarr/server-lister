import ListServerTasksTable from "./serverTasks/ListServerTasksTable"

const ViewServerTasks = ({ serverId }: { serverId: number }) => {
  return (
    <ListServerTasksTable serverId={serverId} />
  )
}

export default ViewServerTasks