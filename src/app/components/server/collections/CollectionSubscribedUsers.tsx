import { Card, Table } from 'antd'
import { useEffect, useState } from 'react'
import type { SelectUser } from '@/db/schema'
import { getUsersInCollection } from '@/app/actions/server/serverCollectionActions'
import { ColumnsType } from 'antd/es/table'

// Define a type that matches what getUsersInCollection returns plus the key property
type CollectionUser = {
  id: string
  email: string | null
  name: string | null
  key: string
}

function CollectionSubscribedUsers({ collectionId }: { collectionId: number }) {
  const [users, setUsers] = useState<CollectionUser[]>([])
  useEffect(() => {
    const getSubscribedUsers = async () => {
      const userResult = await getUsersInCollection(collectionId)
      setUsers(userResult.map(user => ({ ...user, key: user.id })))
    }
    getSubscribedUsers()
  }, [collectionId])
  const columns: ColumnsType<CollectionUser> = [
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: (a, b) => (a.name && b.name) ? a.name.localeCompare(b.name) : 0,
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      sorter: (a, b) => (a.email && b.email) ? a.email.localeCompare(b.email) : 0,
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
    },
  ]
  return (
    <Card title="Subscribed Users">
      <Table columns={columns} dataSource={users} size='small' />
    </Card>
  )
}

export default CollectionSubscribedUsers