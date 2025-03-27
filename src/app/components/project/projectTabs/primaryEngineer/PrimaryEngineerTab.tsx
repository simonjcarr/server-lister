import { useQuery } from "@tanstack/react-query"
import { getPrimaryProjectEngineers } from "@/app/actions/projects/crudActions"
import { Card, Transfer } from 'antd'
import { useState } from 'react'
import { getAllUsers } from "@/app/actions/users/userActions"

const PrimaryEngineers = ({ projectId }: { projectId: number }) => {
  const { data, isLoading: primaryEngineerLoading, error: primaryEngineerError } = useQuery({
    queryKey: ["primaryProjectEngineers", projectId],
    queryFn: () => getPrimaryProjectEngineers(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000
  })

  const { data: allUsers, isLoading: allUsersLoading, error: allUsersError } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => getAllUsers(),
    staleTime: 60 * 1000
  })

  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  return (
    <>
      {(primaryEngineerLoading || allUsersLoading) && <p>Loading...</p>}
      {(primaryEngineerError || allUsersError) && <p>Error: {(primaryEngineerError || allUsersError)?.message}</p>}
      {data && Array.isArray(data) && allUsers && Array.isArray(allUsers) && (
        <Card title="Primary engineers">
          {JSON.stringify(allUsers)}
          <Transfer
            titles={['All Users', 'Primary Engineers']}
            dataSource={allUsers.map(u => ({...u, key: u.id, title: u.name ?? "" }))}
            targetKeys={data.map((d) => d.id)}
          />
        </Card>
      )}
    </>
  )
}

export default PrimaryEngineers