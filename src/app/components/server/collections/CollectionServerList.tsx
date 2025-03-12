'use client'
import { Button, Card, Space, Table, notification } from 'antd'
import React from 'react'
import { useEffect, useState } from 'react'
import { getServerCollection, getServersInCollection, removeServerFromCollection } from '@/app/actions/server/serverCollectionActions';
import { MdDelete } from 'react-icons/md';
import { ColumnsType } from 'antd/es/table';
import type { SelectServerCollection, SelectCollection } from '@/db/schema';
import { getServer } from '@/app/actions/server/crudActions';
import SubscribeCollectionSwitch from './SubscribeCollectionSwitch';
import CollectionSubscribedUsers from './CollectionSubscribedUsers';

function CollectionServerList({ collectionId }: { collectionId: any }) {
  const [servers, setServers] = useState<any[]>([]);
  const [collection, setCollection] = useState<SelectCollection | null>(null);
  const [ api ] = notification.useNotification();
  useEffect(() => {
    async function getServers() {
      const servers = await getServersInCollection(collectionId);
      const collection = await getServerCollection(collectionId);
      setServers(servers.map(server => ({ ...server, key: server.id })));
      if (collection) {
        setCollection(collection[0]);
      }
    }
    getServers();
  }, [collectionId])

  const handleRemoveServerFromList = async (serverId: number) => {
    if (!serverId || !collection) {
      return;
    }
    const serverToRemove = await getServer(serverId)
    if (!serverToRemove) {
      api.error({
        message: 'Not Found',
        description: `Server with id ${serverId} not found`,
        duration: 3,
      })
      return;
    }
    if(!confirm(`Are you sure you want to remove ${serverToRemove.hostname} from the collection?`)) {
      return
    }
    await removeServerFromCollection(serverId, collection.id)
    const servers = await getServersInCollection(collectionId);
    
    setServers(servers.map(server => ({ ...server, key: server.id })));
    // Notify that server has been removed
    api.success({
      message: 'Server Removed',
      description: `Server ${serverToRemove.hostname} has been removed from the collection`,
      duration: 3,
    })
  }

  const columns: ColumnsType<any> = [
    {
      title: 'Hostname',
      dataIndex: 'hostname',
      sorter: (a, b) => a.hostname.localeCompare(b.hostname),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
    },
    {
      title: 'IP',
      dataIndex: 'ipv4',
      sorter: (a, b) => a.ipv4.localeCompare(b.ipv4),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'ascend',
    },
    {
      render: (_: any, record: SelectServerCollection) => (
        <Space>
          {<Button color='red' danger size='small' icon={<MdDelete />} onClick={() => handleRemoveServerFromList(record.id)} />}
        </Space>
      ),
    }
  ]

  return (
    <div className='flex flex-col gap-4'>
      {collection && (
        <Card title={collection.name} extra={<SubscribeCollectionSwitch collectionId={collectionId} />}>
          <p className='text-gray-500 mb-4'>{collection.description}</p>
          <div className='flex flex-col gap-4'>
            <Card title="Servers">
              <Table columns={columns} dataSource={servers} size='small' />
            </Card>
            <CollectionSubscribedUsers collectionId={collectionId} />
          </div>
        </Card>
      )}

    </div>
  )
}

export default CollectionServerList