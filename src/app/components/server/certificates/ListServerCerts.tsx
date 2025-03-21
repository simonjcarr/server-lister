import React from 'react'
import { Table } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getServerCerts } from '@/app/actions/certs/crudActions'
import ClickToCopy from '../../utils/ClickToCopy'
import CertStatus from '@/app/components/certs/CertStatus'

const ClickToCopyDomain = ({ domain }: { domain: string }) => {
  return <ClickToCopy text={domain} />
}

const ListServerCerts = ({ serverId }: { serverId: number }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["certs", serverId],
    queryFn: () => getServerCerts(serverId),
    refetchInterval: 5000,
    enabled: !!serverId,
  })
  return (
    <div>
      {error && <p>Error: {error.message}</p>}
      {isLoading && <p>Loading...</p>}
      {data && (
        <Table
          columns={[
            { 
              title: "Name", 
              dataIndex: "name", 
              sorter: (a, b) => (a.name && b.name) ? a.name.localeCompare(b.name) : 0, sortDirections: ['ascend', 'descend'], defaultSortOrder: 'ascend' 
            },
            { 
              title: "Primary Domain", 
              dataIndex: "primaryDomain", 
              sorter: (a, b) => (a.primaryDomain && b.primaryDomain) ? a.primaryDomain.localeCompare(b.primaryDomain) : 0, sortDirections: ['ascend', 'descend'], defaultSortOrder: 'ascend' ,
              render: (text, record) => <ClickToCopyDomain domain={record.primaryDomain} />
            },
            { 
              title: "Status", 
              render: (text, record) => <CertStatus cert={record.status} />, 
              sorter: (a, b) => (a.status && b.status) ? a.status.localeCompare(b.status) : 0, sortDirections: ['ascend', 'descend'], defaultSortOrder: 'ascend' 
            }
          ]}
          dataSource={data.map(cert => ({ ...cert, key: cert.id }))}
          loading={isLoading}
          size="small"
        />
      )}
    </div>
  )
}

export default ListServerCerts