'use client'

import { useEffect, useState, useCallback } from 'react'
import { Table, Input, Select, Card, Space, Button, Tag, Typography, Tooltip } from 'antd'
import { SearchOutlined, ReloadOutlined, LinkOutlined } from '@ant-design/icons'
import { PaginationParams, ServerFilter, ServerSort, getBusinessOptions, getLocationOptions, getOSOptions, getProjectOptions, getServers } from '@/app/actions/server/crudActions'
import type { SelectServer } from '@/db/schema'
import type { ColumnsType } from 'antd/es/table'
import type { TablePaginationConfig } from 'antd/es/table'
import type { FilterValue, SorterResult, TableCurrentDataSource } from 'antd/es/table/interface'
import type { Breakpoint } from 'antd/es/_util/responsiveObserver'

const { Title } = Typography

type ServerData = Awaited<ReturnType<typeof getServers>>['data'][number] & { key: number }

function ServerList() {
  // State for server data and loading status
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ServerData[]>([])
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: 10,
  })
  const [total, setTotal] = useState(0)

  // State for filter options
  const [businessOptions, setBusinessOptions] = useState<Array<{ id: number; name: string }>>([])
  const [projectOptions, setProjectOptions] = useState<Array<{ id: number; name: string }>>([])
  const [osOptions, setOSOptions] = useState<Array<{ id: number; name: string }>>([])
  const [locationOptions, setLocationOptions] = useState<Array<{ id: number; name: string }>>([])

  // State for active filters
  const [filters, setFilters] = useState<ServerFilter>({})
  const [searchText, setSearchText] = useState('')
  
  // State for sorting
  const [sort, setSort] = useState<ServerSort>({
    field: 'hostname',
    direction: 'asc',
  })

  // Track if we need to load data
  const [shouldLoadData, setShouldLoadData] = useState(true)

  // Load filter options on component mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      const [business, projects, osystems, locations] = await Promise.all([
        getBusinessOptions(),
        getProjectOptions(),
        getOSOptions(),
        getLocationOptions(),
      ])
      
      setBusinessOptions(business)
      setProjectOptions(projects)
      setOSOptions(osystems)
      setLocationOptions(locations)
    }
    
    loadFilterOptions()
  }, [])

  // Load server data based on filters, sorting, and pagination
  const loadData = useCallback(async () => {
    if (!shouldLoadData) return
    
    setLoading(true)
    setShouldLoadData(false)
    
    // Apply search filter if provided
    const currentFilters: ServerFilter = {
      ...filters,
    }
    
    if (searchText) {
      currentFilters.search = searchText
    }
    
    const result = await getServers(currentFilters, sort, pagination)
    
    setData(result.data.map(server => ({ ...server, key: server.id })))
    setTotal(result.pagination.total)
    // Update pagination only if page or pageSize changed from the server
    if (pagination.page !== result.pagination.current || 
        pagination.pageSize !== result.pagination.pageSize) {
      setPagination({
        page: result.pagination.current,
        pageSize: result.pagination.pageSize,
      })
    }
    
    setLoading(false)
  }, [filters, sort, pagination, searchText, shouldLoadData])

  // Trigger data load when needed
  useEffect(() => {
    if (shouldLoadData) {
      loadData()
    }
  }, [shouldLoadData, loadData])

  // When filters, sort, or pagination change, set shouldLoadData to true
  useEffect(() => {
    setShouldLoadData(true)
  }, [filters, sort, pagination, searchText])

  // Map the Ant Design field keys to our backend sort field names
  const mapFieldToSortField = (field: string): string => {
    const fieldMap: Record<string, string> = {
      // Direct mappings
      'hostname': 'hostname',
      'ipv4': 'ipv4',
      'ipv6': 'ipv6',
      'description': 'description',
      // Related fields
      'businessName': 'businessName',
      'projectName': 'projectName',
      'osName': 'osName',
      'locationName': 'locationName',
      // ID fields
      'businessId': 'business',
      'projectId': 'projectId',
      'osId': 'osId',
      'locationId': 'locationId'
    }
    
    return fieldMap[field] || 'hostname' // Default to hostname if unknown
  }

  // Handle table change for sorting and pagination
  const handleTableChange = (
    paginationConfig: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<ServerData> | SorterResult<ServerData>[],
    _extra: TableCurrentDataSource<ServerData>
  ) => {
    console.log('Sort changed:', sorter)
    
    // Update pagination
    if (paginationConfig.current && paginationConfig.pageSize) {
      setPagination({
        page: paginationConfig.current,
        pageSize: paginationConfig.pageSize,
      })
    }
    
    // Update sorting
    if (!Array.isArray(sorter) && sorter.field && sorter.order) {
      const fieldName = sorter.field.toString()
      const sortField = mapFieldToSortField(fieldName)
      
      setSort({
        field: sortField as any,
        direction: sorter.order === 'ascend' ? 'asc' : 'desc',
      })
    }
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof ServerFilter, value: number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }))
    
    // Reset to first page when filter changes
    setPagination(prev => ({
      ...prev,
      page: 1,
    }))
  }

  // Handle search
  const handleSearch = () => {
    // Reset to first page when search changes
    setPagination(prev => ({
      ...prev,
      page: 1,
    }))
  }

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({})
    setSearchText('')
    setPagination({
      page: 1,
      pageSize: 10,
    })
  }

  // Table columns configuration
  const columns: ColumnsType<ServerData> = [
    {
      title: 'Hostname',
      dataIndex: 'hostname',
      key: 'hostname',
      sorter: true,
      sortOrder: sort.field === 'hostname' ? (sort.direction === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (text: string, record: ServerData) => (
        <Space>
          {text}
          {record.docLink && (
            <Tooltip title="Documentation">
              <a href={record.docLink} target="_blank" rel="noopener noreferrer">
                <LinkOutlined />
              </a>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'IPv4',
      dataIndex: 'ipv4',
      key: 'ipv4',
      sorter: true,
      sortOrder: sort.field === 'ipv4' ? (sort.direction === 'asc' ? 'ascend' : 'descend') : undefined,
    },
    {
      title: 'IPv6',
      dataIndex: 'ipv6',
      key: 'ipv6',
      sorter: true,
      sortOrder: sort.field === 'ipv6' ? (sort.direction === 'asc' ? 'ascend' : 'descend') : undefined,
      responsive: ['lg' as Breakpoint],
    },
    {
      title: 'Business',
      dataIndex: 'businessName',
      key: 'businessName',
      sorter: true,
      sortOrder: sort.field === 'businessName' ? (sort.direction === 'asc' ? 'ascend' : 'descend') : undefined,
      responsive: ['md' as Breakpoint],
    },
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
      sorter: true,
      sortOrder: sort.field === 'projectName' ? (sort.direction === 'asc' ? 'ascend' : 'descend') : undefined,
      responsive: ['md' as Breakpoint],
    },
    {
      title: 'OS',
      dataIndex: 'osName',
      key: 'osName',
      sorter: true,
      sortOrder: sort.field === 'osName' ? (sort.direction === 'asc' ? 'ascend' : 'descend') : undefined,
      responsive: ['md' as Breakpoint],
    },
    {
      title: 'Location',
      dataIndex: 'locationName',
      key: 'locationName',
      sorter: true,
      sortOrder: sort.field === 'locationName' ? (sort.direction === 'asc' ? 'ascend' : 'descend') : undefined,
      responsive: ['md' as Breakpoint],
    },
    {
      title: 'Security',
      key: 'security',
      responsive: ['lg' as Breakpoint],
      render: (_: any, record: ServerData) => (
        <Space>
          {record.itar === 1 && <Tag color="red">ITAR</Tag>}
          {record.secureServer === 1 && <Tag color="green">Secure</Tag>}
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      responsive: ['xl' as Breakpoint],
      ellipsis: true,
    },
  ]

  return (
    <Card>
      <Title level={4}>Server List</Title>
      
      {/* Filter and search controls */}
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search hostname, IP, description"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 250 }}
          suffix={
            <Button type="text" icon={<SearchOutlined />} onClick={handleSearch} />
          }
        />
        
        <Select
          placeholder="Business"
          style={{ width: 150 }}
          allowClear
          value={filters.businessId}
          onChange={value => handleFilterChange('businessId', value)}
          options={businessOptions.map(b => ({ value: b.id, label: b.name }))}
        />
        
        <Select
          placeholder="Project"
          style={{ width: 150 }}
          allowClear
          value={filters.projectId}
          onChange={value => handleFilterChange('projectId', value)}
          options={projectOptions.map(p => ({ value: p.id, label: p.name }))}
        />
        
        <Select
          placeholder="OS"
          style={{ width: 150 }}
          allowClear
          value={filters.osId}
          onChange={value => handleFilterChange('osId', value)}
          options={osOptions.map(o => ({ value: o.id, label: o.name }))}
        />
        
        <Select
          placeholder="Location"
          style={{ width: 150 }}
          allowClear
          value={filters.locationId}
          onChange={value => handleFilterChange('locationId', value)}
          options={locationOptions.map(l => ({ value: l.id, label: l.name }))}
        />
        
        <Button
          icon={<ReloadOutlined />}
          onClick={() => setShouldLoadData(true)}
        >
          Refresh
        </Button>
        
        <Button onClick={handleClearFilters}>
          Clear Filters
        </Button>
      </Space>
      
      {/* Server data table */}
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
        size="middle"
      />
    </Card>
  )
}

export default ServerList