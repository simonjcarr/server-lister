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
    queryKey: ["primaryProjectEngineers", "ids", projectId],
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
    mutationFn: async (userIds: string[]) => {
      return await updatePrimaryProjectEngineers(projectId, userIds)
    } ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["primaryProjectEngineers", "ids", projectId], exact: true });
      queryClient.invalidateQueries({ queryKey: ["primaryProjectEngineers", "list", projectId], exact: true });
    },
    onError: (error) => {
      console.error("Mutation failed:", error);
    }
  })

  const onChange: TransferProps['onChange'] = async (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys.map((k) => k.toString()));
    await updatePrimaryEngineers(nextTargetKeys.map((k) => k.toString()));
  };
  
  return (
    <>
      {(primaryEngineerLoading || allUsersLoading) && <p>Loading...</p>}
      {(primaryEngineerError || allUsersError) && <p>Error: {(primaryEngineerError || allUsersError)?.message}</p>}
      {JSON.stringify({targetKeys})}
      {data && Array.isArray(data) && allUsers && Array.isArray(allUsers) && (
        <Card title="Primary engineers">
          {updatePrimaryEngineersError && <p>Error: {updatePrimaryEngineersError.message}</p>}
          <Transfer
            listStyle={{ width: 400}}
            titles={['All Users', 'Primary Engineers']}
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