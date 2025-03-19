import { Tabs } from "antd"
import ViewOS from "../../os/ViewOS"
import { useQuery } from "@tanstack/react-query"
import { getServerById } from "@/app/actions/server/crudActions"
import HardwareTabData from "./HardwareTabData"
import NetworkTabData from "./NetworkTabData"
import ViewServerNotes from "./notes/ViewServerNotes"

const ViewServerTabs = ({ serverId }: { serverId: number }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => getServerById(serverId),
    enabled: !!serverId,
  })
  const items = [
    { key: 'hardware', label: 'Hardware', children: <HardwareTabData serverId={serverId} /> },
    { key: 'network', label: 'Network', children: <NetworkTabData serverId={serverId} /> },
    { key: 'storage', label: 'Storage', children: <div>Storage</div> },
    { key: 'os', label: 'OS', children: <ViewOS osId={data?.osId ?? 0} /> },
    { key: 'services', label: 'Services', children: <div>Services</div> },
    { key: 'users', label: 'Users', children: <div>Users</div> },
    { key: 'software', label: 'Software', children: <div>Software</div> },
    { key: 'notes', label: 'Notes', children: <ViewServerNotes /> },
  ]
  return (
    <>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <>
          <Tabs tabPosition="left" items={items} />
        </>
      )}
    </>
  )
}

export default ViewServerTabs