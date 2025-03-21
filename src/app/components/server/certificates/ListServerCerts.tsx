import React from 'react'
import { Table } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getServerCerts } from '@/app/actions/certs/crudActions'


const CertStatus = ({ cert }: { cert: string | null }) => {
  return <span>{cert || "Pending"}</span>
}

const ListServerCerts = ({ serverId }: { serverId: number }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["certs", serverId],
    queryFn: () => getServerCerts(serverId),
  })
  return (
    <div>
      {error && <p>Error: {error.message}</p>}
      {isLoading && <p>Loading...</p>}
      {data && (
        <Table
          columns={[
            { title: "Name", dataIndex: "name" },
            { title: "Description", dataIndex: "description" },
            { title: "Primary Domain", dataIndex: "primaryDomain" },
          { title: "Other Domains", dataIndex: "otherDomains" },
          { title: "Status", render: (text, record) => <CertStatus cert={record.cert} /> }
        ]}
        dataSource={data}
        loading={isLoading}
        size="small"
      />
      )}
    </div>
  )
}

export default ListServerCerts