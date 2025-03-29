'use client'

import { useState } from 'react'
import { Table, Input, Select, Card, Space, Button, Tag, Typography, Checkbox, message } from 'antd'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { HeartFilled, HeartOutlined, SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons'
import { PaginationParams, ServerFilter, ServerSort, getBusinessOptions, getLocationOptions, getOSOptions, getProjectOptions, getServers } from '@/app/actions/server/crudActions'
import { useSession } from 'next-auth/react'
import { getUserFavoriteServersWithDetails, addServerToUser, removeServerFromUser } from '@/app/actions/server/userServerActions'
import type { ColumnsType } from 'antd/es/table'
import type { TablePaginationConfig } from 'antd/es/table'
import type { FilterValue, SorterResult } from 'antd/es/table/interface'
import type { Breakpoint } from 'antd/es/_util/responsiveObserver'
import { useRouter } from 'next/navigation'
import ClickToCopy from '../utils/ClickToCopy';
import FormAddServer from './FormAddServer'

const { Title } = Typography

type ServerData = Awaited<ReturnType<typeof getServers>>['data'][number] & { key: number }

function ServerList() {
  const router = useRouter()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  // State for pagination, filters, and sorting
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: 10,
  })

  // State for active filters
  const [filters, setFilters] = useState<ServerFilter>({})
  const [searchText, setSearchText] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // State for sorting
  const [sort, setSort] = useState<ServerSort>({
    field: 'hostname',
    direction: 'asc',
  })

  // Current filters including search text
  const currentFilters: ServerFilter = searchText ? { ...filters, search: searchText } : { ...filters }

  // Query for filter options
  const filterQueries = useQueries({
    queries: [
      {
        queryKey: ['businessOptions'],
        queryFn: getBusinessOptions,
      },
      {
        queryKey: ['projectOptions'],
        queryFn: getProjectOptions,
      },
      {
        queryKey: ['osOptions'],
        queryFn: getOSOptions,
      },
      {
        queryKey: ['locationOptions'],
        queryFn: getLocationOptions,
      },
    ],
  })

  const businessOptions = filterQueries[0].data ?? []
  const projectOptions = filterQueries[1].data ?? []
  const osOptions = filterQueries[2].data ?? []
  const locationOptions = filterQueries[3].data ?? []

  // Query for favorite servers
  const { data: favoriteServers = [] } = useQuery({
    queryKey: ['favoriteServers'],
    queryFn: getUserFavoriteServersWithDetails,
    enabled: !!session, // Only run if user is logged in
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Create a set of favorite server IDs for faster lookup
  const favoriteServerIds = new Set(favoriteServers.map(fav => fav.serverId))

  // Add to favorites mutation
  const { mutate: toggleFavorite } = useMutation({
    mutationFn: async ({ serverId, action }: { serverId: number; action: 'add' | 'remove' }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      
      if (action === 'add') {
        return await addServerToUser(serverId, session.user.id);
      } else {
        return await removeServerFromUser(serverId, session.user.id);
      }
    },
    onSuccess: (_, variables) => {
      // Show success message
      if (variables.action === 'add') {
        message.success('Added to favorites');
      } else {
        message.success('Removed from favorites');
      }
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['favoriteServers'] });
    },
    onError: (error) => {
      console.error('Error toggling favorite:', error);
      message.error('Failed to update favorites');
    },
  });

  // Handle favorite toggle
  const handleFavoriteToggle = (e: React.MouseEvent, serverId: number) => {
    e.stopPropagation(); // Prevent row click
    
    if (!session?.user?.id) return;
    
    const action = favoriteServerIds.has(serverId) ? 'remove' : 'add';
    toggleFavorite({ serverId, action });
  };

  // Query for server data
  const { data: serverData, isLoading, refetch } = useQuery({
    queryKey: ['servers', currentFilters, sort, pagination, showFavoritesOnly],
    queryFn: () => getServers(currentFilters, sort, pagination),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000 // 5 minutes
  })

  // Process server data
  let data = serverData?.data.map(server => ({ ...server, key: server.id })) ?? []
  
  // Filter by favorites if needed
  if (showFavoritesOnly && session) {
    data = data.filter(server => favoriteServerIds.has(server.id))
  }
  
  const total = showFavoritesOnly ? data.length : (serverData?.pagination.total ?? 0)
  
  // Update pagination if needed
  if (serverData && (pagination.page !== serverData.pagination.current || 
      pagination.pageSize !== serverData.pagination.pageSize)) {
    setPagination({
      page: serverData.pagination.current,
      pageSize: serverData.pagination.pageSize,
    })
  }

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    setShowFavoritesOnly(false)
    setPagination({
      page: 1,
      pageSize: 10,
    })
  }

  // Table columns configuration
  const columns: ColumnsType<ServerData> = [
    {
      title: 'Favorite',
      key: 'favorite',
      width: 70,
      align: 'center',
      render: (_, record: ServerData) => (
        <div onClick={(e) => handleFavoriteToggle(e, record.id)} className="cursor-pointer hover:text-blue-500">
          {favoriteServerIds.has(record.id) ? 
            <HeartFilled style={{ color: '#FFD700', fontSize: '18px' }} /> : 
            <HeartOutlined style={{ color: '#d9d9d9', fontSize: '18px' }} />}
        </div>
      ),
    },
    {
      title: 'Hostname',
      dataIndex: 'hostname',
      key: 'hostname',
      sorter: true,
      sortOrder: sort.field === 'hostname' ? (sort.direction === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (text: string, record: ServerData) => (
        <ClickToCopy text={record.hostname ?? ''} />
      ),
    },
    {
      title: 'IPv4',
      dataIndex: 'ipv4',
      key: 'ipv4',
      sorter: true,
      sortOrder: sort.field === 'ipv4' ? (sort.direction === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (text: string, record: ServerData) => (
        <ClickToCopy text={record.ipv4 ?? ''} />
      ),
    },
    {
      title: 'IPv6',
      dataIndex: 'ipv6',
      key: 'ipv6',
      sorter: true,
      sortOrder: sort.field === 'ipv6' ? (sort.direction === 'asc' ? 'ascend' : 'descend') : undefined,
      responsive: ['lg' as Breakpoint],
      render: (text: string, record: ServerData) => (
        <ClickToCopy text={record.ipv6 ?? ''} />
      ),
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
      render: (_, record: ServerData) => (
        <Space>
          {record.itar === true && <Tag color="red">ITAR</Tag>}
          {record.secureServer === true && <Tag color="green">Secure</Tag>}
        </Space>
      ),
    },
  ]

  return (
    <Card>
      <Title level={4} className='flex justify-between items-center'>
        <div>Server List</div>
        <FormAddServer><Button icon={<PlusOutlined />} size='small'>New Server</Button></FormAddServer>
      </Title>

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
        
        {session && (
          <Checkbox
            checked={showFavoritesOnly}
            onChange={e => setShowFavoritesOnly(e.target.checked)}
          >
            <Space>
              <HeartOutlined style={{ color: showFavoritesOnly ? '#ff4d4f' : undefined }} />
              Favorites Only
            </Space>
          </Checkbox>
        )}

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
          onClick={() => refetch()}
        >
          Refresh
        </Button>

        <Button onClick={handleClearFilters}>
          Clear Filters
        </Button>
      </Space>

      {/* Server data table */}
      <Table
        onRow={(record)=> {return { 
          onClick: () => {
            router.push(`/server/view/${record.id}`)
          },
          className: 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
        }}}
        columns={columns}
        dataSource={data}
        loading={isLoading}
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