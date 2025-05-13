import { Tabs, App } from "antd"
import { useQuery } from "@tanstack/react-query"
import { getServerById } from "@/app/actions/server/crudActions"
import HardwareTabData from "./HardwareTabData"
import NetworkTabData from "./NetworkTabData"
import ViewServerNotes from "./notes/ViewServerNotes"
import CertificateTabData from "./certificates/CertificateTabData"
import ServerStorage from "./storage/ServerStorage"
import ServerSoftware from "./software/ServerSoftware"
import ServerServices from "./services/ServerServices"
import ServerUsers from "./users/ServerUsers"
import ServerOS from "./os/ServerOS"
import ServerDrawings from "./drawings/ServerDrawings"
import ServerOnboardingStatus from "./ServerOnboardingStatus"
import ProjectTabData from "./project/ProjectTabData"
import ViewServerTasks from "./ViewServerTasks"
import { EngineerHoursTab } from "./engineerHours"
import { ChatPanel } from "@/app/components/chat/ChatPanel"
import { useRouter } from "next/navigation"


const ViewServerTabs = ({ serverId }: { serverId: number }) => {
  const router = useRouter();
  const { data, error, isLoading } = useQuery({
    queryKey: ["server", serverId],
    queryFn: () => getServerById(serverId),
    enabled: !!serverId,
    staleTime: 600000, // 10 minutes
    refetchInterval: 600000, // 10 minutes
  })
  
  // Handle build docs navigation
  const handleBuildDocsClick = () => {
    router.push(`/server/view/${serverId}/build-docs`);
  }; 
  const items = [
    { key: 'hardware', label: 'Hardware', children: <HardwareTabData serverId={serverId} /> },
    { key: 'network', label: 'Network', children: <NetworkTabData serverId={serverId} /> },
    { key: 'project', label: 'Project', children: <ProjectTabData serverId={serverId} /> },
    { key: 'certs', label: 'Certificates', children: <CertificateTabData serverId={serverId} /> },
    { key: 'storage', label: 'Storage', children: <ServerStorage serverId={serverId} /> },
    { key: 'os', label: 'OS', children: <ServerOS serverId={serverId} /> },
    { key: 'services', label: 'Services', children: <ServerServices serverId={serverId} /> },
    { key: 'users', label: 'Users', children: <ServerUsers serverId={serverId} /> },
    { key: 'software', label: 'Software', children: <ServerSoftware serverId={serverId} /> },
    { key: 'drawings', label: 'Drawings', children: <ServerDrawings serverId={serverId} /> },
    { key: 'notes', label: 'Notes', children: <ViewServerNotes serverId={serverId} /> },
    { key: 'tasks', label: 'Tasks', children: <ViewServerTasks serverId={serverId} /> },
    { key: 'hours', label: 'Engineer Hours', children: <EngineerHoursTab serverId={serverId} /> },
    { key: 'buildDocs', label: 'Build Docs', children: <div className="p-4"><button onClick={handleBuildDocsClick} className="ant-btn ant-btn-primary">View Build Documentation</button></div> },
    { key: 'chat', label: 'Chat', children: <ChatPanel serverId={serverId} /> },
  ]
  return (
    <App>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <>
          <ServerOnboardingStatus serverId={serverId} />
          <Tabs 
            className="max-h-[90vh] server-tabs" 
            tabPosition="left" 
            items={items}
            // Add custom inline styles for the tab component
            style={{ 
              // We'll add CSS classes instead for more specific styling
            }} 
          />
        </>
      )}
    </App>
  )
}

export default ViewServerTabs