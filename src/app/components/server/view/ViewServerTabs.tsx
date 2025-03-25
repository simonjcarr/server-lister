import { Tabs } from "antd"
import ViewOS from "../../os/ViewOS"
import { useQuery } from "@tanstack/react-query"
import { getServerById } from "@/app/actions/server/crudActions"
import HardwareTabData from "./HardwareTabData"
import NetworkTabData from "./NetworkTabData"
import ViewServerNotes from "./notes/ViewServerNotes"
import CertificateTabData from "./certificates/CertificateTabData"
import ServerStorage from "./storage/ServerStorage"
import ServerSoftware from "./software/ServerSoftware"

const ViewServerTabs = ({ serverId }: { serverId: number }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => getServerById(serverId),
    enabled: !!serverId,
    staleTime: 600000, // 10 minutes
    refetchInterval: 600000, // 10 minutes
  })
  const items = [
    { key: 'hardware', label: 'Hardware', children: <HardwareTabData serverId={serverId} /> },
    { key: 'network', label: 'Network', children: <NetworkTabData serverId={serverId} /> },
    { key: 'certs', label: 'Certificates', children: <CertificateTabData serverId={serverId} /> },
    { key: 'storage', label: 'Storage', children: <ServerStorage serverId={serverId} /> },
    { key: 'os', label: 'OS', children: <ViewOS osId={data?.osId ?? 0} /> },
    { key: 'services', label: 'Services', children: <div>Services</div> },
    { key: 'users', label: 'Users', children: <div>Users</div> },
    { key: 'software', label: 'Software', children: <ServerSoftware serverId={serverId} /> },
    { key: 'notes', label: 'Notes', children: <ViewServerNotes serverId={serverId} /> },
  ]
  return (
    <>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <>
          <Tabs className="max-h-[90vh]" tabPosition="left" items={items} />
        </>
      )}
    </>
  )
}

export default ViewServerTabs