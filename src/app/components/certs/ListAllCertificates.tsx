'use client'
import React from 'react'
import { useQuery } from "@tanstack/react-query"
import { getAllCertificates } from '@/app/actions/certs/crudActions'
import { Input, Table, Tag } from 'antd'
import CertStatus from '@/app/components/certs/CertStatus'
import ClickToCopy from '../utils/ClickToCopy'
import { MoreOutlined, SearchOutlined } from '@ant-design/icons'
import CertDropDownMenu from './CertDropDownMenu'

const ListAllCertificates = () => {
  const [searchText, setSearchText] = React.useState('')
  const { data, error, isLoading } = useQuery({
    queryKey: ['certs'],
    queryFn: () => getAllCertificates()
  })
  return (
    <div>
      <div className="text-2xl font-bold mb-4">All Certificates</div>
      <Input
        className='mb-4'
        value={searchText}
        size='large'
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search"
        prefix={<SearchOutlined />}
      />
      <div>
        Total Records: {data?.length || 0} | Filtered Records: {data?.filter(cert => cert.primaryDomain.includes(searchText) || (Array.isArray(cert.otherDomains) ? cert.otherDomains : []).some(domain => domain.domain.includes(searchText)) || cert.status.includes(searchText) || cert.server?.name.includes(searchText) || (cert.requestedBy?.name || '').includes(searchText)).length || 0}
      </div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && (
        <Table
          size="small"
          columns={[
            {
              title: 'Status',
              dataIndex: 'status',
              render: (text) => <CertStatus status={text} />, sorter: (a, b) => (a.status && b.status) ? a.status.localeCompare(b.status) : 0, sortDirections: ['ascend', 'descend'], defaultSortOrder: 'ascend',
              filters: [
                { text: 'Pending', value: 'Pending' },
                { text: 'Ordered', value: 'Ordered' },
                { text: 'Ready', value: 'Ready' },
              ],
              onFilter: (value, record) => record.status === value
            },
            {
              title: 'Primary Domain',
              dataIndex: 'primaryDomain',
              render: (text) => <ClickToCopy text={text} />,
              sorter: (a, b) => (a.primaryDomain && b.primaryDomain) ? a.primaryDomain.localeCompare(b.primaryDomain) : 0, sortDirections: ['ascend', 'descend'], defaultSortOrder: 'ascend',
              filters: data.map(cert => ({ text: cert.primaryDomain, value: cert.primaryDomain })),
              onFilter: (value, record) => record.primaryDomain === value
            },
            {
              title: 'Other Domains',
              dataIndex: 'otherDomains',
              render: (text) => {
                return text && text.map((domain: { domain: string }) => <Tag key={domain.domain}>{domain.domain}</Tag>)
              },

            },
            {
              title: 'Server Host',
              dataIndex: ['server', 'name'],
              render: (text) => text || 'N/A',
              sorter: (a, b) => (a.server?.name && b.server?.name) ? a.server.name.localeCompare(b.server.name) : 0, sortDirections: ['ascend', 'descend'], defaultSortOrder: 'ascend'
            },
            {
              title: 'Requested By',
              dataIndex: ['requestedBy', 'name'],
              render: (text) => text || 'N/A',
              sorter: (a, b) => (a.requestedBy?.name && b.requestedBy?.name) ? a.requestedBy.name.localeCompare(b.requestedBy.name) : 0, sortDirections: ['ascend', 'descend'], defaultSortOrder: 'ascend'
            },
            {
              render: (text, record) => <CertDropDownMenu certId={record.id}><MoreOutlined /></CertDropDownMenu>
            }
          ]}
          dataSource={
            data.filter(
              cert => cert.primaryDomain.toLowerCase().includes(searchText.toLowerCase()) ||
                (Array.isArray(cert.otherDomains) ? cert.otherDomains : []).some((domain: { domain: string }) => domain.domain.toLowerCase().includes(searchText.toLowerCase())) ||
              cert.status.toLowerCase().includes(searchText.toLowerCase()) ||
              cert.server?.name.toLowerCase().includes(searchText.toLowerCase()) ||
              (cert.requestedBy?.name?.toLowerCase() || '').includes(searchText.toLowerCase())
            )
            .map(cert => ({ ...cert, key: cert.id }))}
          loading={isLoading}
        />
      )}
    </div>
  )
}

export default ListAllCertificates