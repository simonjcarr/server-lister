import { Tabs } from "antd"
import ViewOS from "../../os/ViewOS"
import { useQuery } from "@tanstack/react-query"
import { getServerById } from "@/app/actions/server/crudActions"

const ViewServerTabs = ({ serverId }: { serverId: number }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => getServerById(serverId),
    enabled: !!serverId,
  })
  const items = [
    { key: 'hardware', label: 'Hardware', children: <div>Hardware {serverId}</div> },
    { key: 'network', label: 'Network', children: <div>Network</div> },
    { key: 'storage', label: 'Storage', children: <div>Storage</div> },
    { key: 'os', label: 'OS', children: <ViewOS osId={data?.osId} /> },
    { key: 'services', label: 'Services', children: <div>Services</div> },
    { key: 'users', label: 'Users', children: <div>Users</div> },
    { key: 'software', label: 'Software', children: <div>Software</div> },
    { key: 'notes', label: 'Notes', children: <div>Notes</div> },
    
  ]
  return (
    <Tabs tabPosition="left" items={items} />
  )
}

export default ViewServerTabs