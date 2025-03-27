'use client'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getPrimaryProjectEngineerIDs, updatePrimaryProjectEngineers } from "@/app/actions/projects/crudActions"
import { Card, Transfer } from 'antd'
import { useEffect, useState } from 'react'
import { getAllUsers } from "@/app/actions/users/userActions"
import type { TransferProps } from 'antd'

const PrimaryEngineers = ({ projectId }: { projectId: number }) => {
  const queryClient = useQueryClient()
  const { data, isLoading: primaryEngineerLoading, error: primaryEngineerError } = useQuery({
    queryKey: ["primaryProjectEngineers", projectId],
    queryFn: () => getPrimaryProjectEngineerIDs(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000
  })

  
  const [targetKeys, setTargetKeys] = useState<TransferProps['targetKeys']>([]);

  useEffect(() => {
    if (data) {
      setTargetKeys(data.map((id) => id.toString()));
    }
  }, [data]);

  const { data: allUsers, isLoading: allUsersLoading, error: allUsersError } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => getAllUsers(),
    staleTime: 60 * 1000
  })

  const { mutate: updatePrimaryEngineers, error: updatePrimaryEngineersError } = useMutation({
    mutationFn: (userIds: string[]) => updatePrimaryProjectEngineers(projectId, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["primaryProjectEngineers", projectId] });
    }
  })

  const onChange: TransferProps['onChange'] = (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys.map((k) => k.toString()));
    updatePrimaryEngineers(nextTargetKeys.map((k) => k.toString()));
  };
  
  return (
    <>
      {(primaryEngineerLoading || allUsersLoading) && <p>Loading...</p>}
      {(primaryEngineerError || allUsersError) && <p>Error: {(primaryEngineerError || allUsersError)?.message}</p>}
      {data && Array.isArray(data) && allUsers && Array.isArray(allUsers) && (
        <Card title="Primary engineers">
          {updatePrimaryEngineersError && <p>Error: {updatePrimaryEngineersError.message}</p>}
          <Transfer
            
            titles={['All', 'Primary']}
            dataSource={allUsers.map(u => ({key: u.id.toString(), title: u.name || '' }))}
            targetKeys={targetKeys}
            onChange={onChange}
            render={(item) => item.title}
            showSearch
          />
        </Card>
      )}
    </>
  )
}

export default PrimaryEngineers