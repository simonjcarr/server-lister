'use client'

import { useState, useEffect, useCallback } from 'react'
import { Table, Card, Space, Button, Tag, Typography, App, Tooltip } from 'antd'
import { useQuery, useQueries, useMutation} from '@tanstack/react-query'
import { HeartFilled, HeartOutlined, PlusOutlined } from '@ant-design/icons'
import ServerFilters from './ServerFilters'
import { PaginationParams, ServerFilter, ServerSort, getBusinessOptions, getLocationOptions, getOSOptions, getProjectOptions, getServers } from '@/app/actions/server/crudActions'
import { getServerCollections } from '@/app/actions/server/serverCollectionActions'
import { useSession } from 'next-auth/react'
import { getUserFavoriteServersWithDetails, addServerToUser, removeServerFromUser, manualAddFavorite } from '@/app/actions/server/clientActions'
import type { ColumnsType } from 'antd/es/table'
import type { TablePaginationConfig } from 'antd/es/table'
import type { FilterValue, SorterResult } from 'antd/es/table/interface'
import type { Breakpoint } from 'antd/es/_util/responsiveObserver'
import { useRouter } from 'next/navigation'
import ClickToCopy from '../utils/ClickToCopy';
import FormAddServer from './FormAddServer'

const { Title } = Typography

// Define the server data type with all needed fields
type ServerData = Awaited<ReturnType<typeof getServers>>['data'][number] & { 
  key: number;
  onboarded?: boolean;
}

function ServerList() {
  const router = useRouter()
  const { data: session } = useSession()
  const { message } = App.useApp()
  // State for pagination, filters, and sorting
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    pageSize: 10,
  })
  
  // State to force re-renders on favorite toggle
  const [favoriteToggleCount, setFavoriteToggleCount] = useState(0)

  // State for active filters
  const [filters, setFilters] = useState<ServerFilter>({})
  const [searchText, setSearchText] = useState('')
  
  // Callback for handling filter changes
  const handleFilterChange = useCallback((key: keyof ServerFilter, value: string | number | boolean | null | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }))

    // Reset to first page when filter changes
    setPagination(prev => ({
      ...prev,
      page: 1,
    }))
  }, [])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // State for sorting
  const [sort, setSort] = useState<ServerSort>({
    field: 'hostname',
    direction: 'asc',
  })

  // Current filters including search text
  const currentFilters: ServerFilter = searchText ? { ...filters, search: searchText } : { ...filters }
  
  // Determine stale time based on whether we're filtering by collection
  const staleTime = filters.collectionId ? 0 : 5 * 60 * 1000; // 0 for collection filter, 5 minutes otherwise

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
      {
        queryKey: ['collectionOptions'],
        queryFn: getServerCollections,
      },
    ],
  })

  const businessOptions = filterQueries[0].data ?? []
  const projectOptions = filterQueries[1].data ?? []
  const osOptions = filterQueries[2].data ?? []
  const locationOptions = filterQueries[3].data ?? []
  const collectionOptions = filterQueries[4].data ?? []

  // Query for favorite servers
  const { data: favoriteServers = [], refetch: refetchFavorites } = useQuery({
    queryKey: ['favoriteServers', favoriteToggleCount],
    queryFn: getUserFavoriteServersWithDetails,
    enabled: !!session, // Only run if user is logged in
    staleTime: 0, // Always fetch fresh data
  })

  // Create a set of favorite server IDs for faster lookup
  const favoriteServerIds = new Set(favoriteServers.map(fav => fav.serverId))

  // Add to favorites mutation
  const { mutate: toggleFavorite } = useMutation({
    mutationFn: async ({ serverId, action }: { serverId: number; action: 'add' | 'remove' }) => {
      if (!session?.user?.id) throw new Error('User not authenticated');
      
      try {
        let result;
        if (action === 'add') {
          result = await addServerToUser(serverId, session.user.id);
        } else {
          result = await removeServerFromUser(serverId, session.user.id);
        }
        
        return { result, serverId, action };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Increment counter to force refetch
      setFavoriteToggleCount(prev => prev + 1);
      
      // Optimistically update UI
      if (variables.action === 'add') {
        favoriteServerIds.add(variables.serverId);
        message.success('Added to favorites');
      } else {
        favoriteServerIds.delete(variables.serverId);
        message.success('Removed from favorites');
      }
      
      // Manually refetch favorites
      setTimeout(() => {
        refetchFavorites();
      }, 500);
    },
    onError: () => {
      message.error('Failed to update favorites');
    },
  });

  // Handle favorite toggle
  const handleFavoriteToggle = (e: React.MouseEvent, serverId: number) => {
    e.stopPropagation(); // Prevent row click
    
    if (!session?.user?.id) {
      message.warning('Please log in to add favorites');
      return;
    }
    
    // Get current state
    const isCurrentlyFavorite = favoriteServerIds.has(serverId);
    const action = isCurrentlyFavorite ? 'remove' : 'add';
    
    if (action === 'add') {
      // If we're trying to add, use our manual method that's more reliable
      handleManualAddFavorite(serverId);
    } else {
      // For removal, use the normal method
      toggleFavorite({ serverId, action });
    }
  };
  
  // Force manual add (for diagnostics)
  const handleManualAddFavorite = async (serverId: number) => {
    if (!session?.user?.id) {
      message.warning('Please log in to add favorites');
      return;
    }
    
    try {
      const result = await manualAddFavorite(serverId);
      
      if (result.success) {
        message.success('Added to favorites');
        // Force a refresh of favorite data
        setFavoriteToggleCount(prev => prev + 1);
        refetchFavorites();
        
        // Also force add to local Set
        favoriteServerIds.add(serverId);
      } else {
        message.error(`Failed to add to favorites`);
      }
    } catch {
      message.error('Failed to add to favorites');
    }
  };

  // Query for server data
  const { data: serverData, isLoading, refetch } = useQuery({
    queryKey: ['servers', currentFilters, sort, pagination, showFavoritesOnly],
    queryFn: () => getServers(currentFilters, sort, pagination),
    staleTime: staleTime, // Dynamic stale time based on collection filter
    refetchInterval: filters.collectionId ? 3000 : 5 * 60 * 1000 // More frequent refresh with collection filter
  })

  // Listen for custom events to apply filters
  useEffect(() => {
    const handleApplyFilters = (event: CustomEvent) => {
      const { onboardingStatus } = event.detail;
      if (onboardingStatus) {
        handleFilterChange('onboardingStatus', onboardingStatus);
      }
    };

    // Add event listener for custom filter event
    window.addEventListener('applyServerFilters', handleApplyFilters as EventListener);
    
    return () => {
      window.removeEventListener('applyServerFilters', handleApplyFilters as EventListener);
    };
  }, [handleFilterChange]);

  // Effect to refetch when collection filter is active
  useEffect(() => {
    // If we're filtering by a collection, make sure we stay up to date
    if (filters.collectionId) {
      // Set a shorter stale time when collection filter is active
      const timer = setInterval(() => {
        refetch();
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(timer);
    }
  }, [filters.collectionId, refetch]);
  
  // Effect to refetch favorites when the toggle count changes
  useEffect(() => {
    if (favoriteToggleCount > 0) {
      refetchFavorites();
    }
  }, [favoriteToggleCount, refetchFavorites]);

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
  const mapFieldToSortField = (field: string): ServerSort['field'] => {
    const fieldMap: Record<string, ServerSort['field']> = {
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
          field: sortField,
        direction: sorter.order === 'ascend' ? 'asc' : 'desc',
      })
    }
  }

  // Expose the filter change handler through the component interface
  const handleExternalFilterChange = (key: keyof ServerFilter, value: string | number | undefined) => {
    handleFilterChange(key, value);
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
      render: (_, record: ServerData) => {
        const isFavorite = favoriteServerIds.has(record.id);
        return (
          <div 
            onClick={(e) => handleFavoriteToggle(e, record.id)} 
            className="cursor-pointer hover:text-blue-500 flex items-center justify-center"
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? 
              <HeartFilled style={{ color: '#FFD700', fontSize: '18px' }} /> : 
              <HeartOutlined style={{ color: '#d9d9d9', fontSize: '18px' }} />}
          </div>
        );
      },
    },
    {
      title: 'Hostname',
      dataIndex: 'hostname',
      key: 'hostname',
      sorter: true,
      sortOrder: sort.field === 'hostname' ? (sort.direction === 'asc' ? 'ascend' : 'descend') : undefined,
      render: (text: string, record: ServerData) => (
        <div className="flex items-center gap-2">
          <ClickToCopy text={record.hostname ?? ''} />
          {record.onboarded === false && (
            <Tooltip title="This server is new and has not been onboarded yet">
              <Tag color="gold">New</Tag>
            </Tooltip>
          )}
        </div>
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
    <App>
      <Card>
        <Title level={4} className='flex justify-between items-center'>
          <div>Server List</div>
          <FormAddServer><Button icon={<PlusOutlined />} size='small'>New Server</Button></FormAddServer>
        </Title>

      {/* Use the new ServerFilters component */}
      <ServerFilters 
        filters={filters}
        onFilterChange={handleExternalFilterChange}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        onSearch={handleSearch}
        onClearFilters={handleClearFilters}
        onRefresh={() => refetch()}
        showFavoritesOnly={showFavoritesOnly}
        onFavoritesToggle={setShowFavoritesOnly}
        businessOptions={businessOptions}
        projectOptions={projectOptions}
        osOptions={osOptions}
        locationOptions={locationOptions}
        collectionOptions={collectionOptions}
        hasSession={!!session}
      />

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
    </App>
  )
}

export default ServerList