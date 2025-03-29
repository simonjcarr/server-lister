'use client'
import { Card, Empty, Table } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { getUsersInCollection } from '@/app/actions/server/serverCollectionActions'
import { useQuery } from '@tanstack/react-query'

// Define a type that matches what getUsersInCollection returns plus the key property
type CollectionUser = {
  id: string
  email: string | null
  name: string | null
  key: string
}

function CollectionSubscribedUsers({ collectionId }: { collectionId: number }) {
  const { isPending, error, data } = useQuery({
    queryKey: ['usersInCollection', collectionId],
    queryFn: () => getUsersInCollection(collectionId),
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  const columns: ColumnsType<CollectionUser> = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => (a.name && b.name) ? a.name.localeCompare(b.name) : 0,
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
      render: (text) => text || '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      sorter: (a, b) => (a.email && b.email) ? a.email.localeCompare(b.email) : 0,
      sortDirections: ['ascend', 'descend'],
      render: (text) => text || '-',
    },
  ]
  
  return (
    <Card 
      title="Subscribed Users"
      styles={{ 
        body: { 
          padding: data?.length ? undefined : 0 
        } 
      }}
    >
      {isPending ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error loading subscribed users</div>
      ) : data?.length ? (
        <Table 
          columns={columns} 
          dataSource={data.map(user => ({ ...user, key: user.id }))} 
          size='small'
          pagination={{ 
            pageSize: 10,
            hideOnSinglePage: data.length <= 10,
          }}
          className="collections-table"
        />
      ) : (
        <Empty 
          description="No users subscribed to this collection" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Card>
  )
}

export default CollectionSubscribedUsers