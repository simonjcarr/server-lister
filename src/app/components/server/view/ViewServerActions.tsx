import ListServerActionsTable from "./serverActions/ListServerActionsTable"

const ViewServerActions = ({ serverId }: { serverId: number }) => {
  return (
    <ListServerActionsTable serverId={serverId} />
  )
}

export default ViewServerActions