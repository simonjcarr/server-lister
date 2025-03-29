'use client';

import React, { useEffect, useState } from 'react';
import { App, Button, Modal, Table, Input, Select, Space, Drawer, Tag } from 'antd';
import { addServersToCollection } from '@/app/actions/server/collectionActions';
import { getServers, getOSOptions, getProjectOptions, getBusinessOptions, getLocationOptions, ServerFilter } from '@/app/actions/server/crudActions';
import { useQueryClient } from '@tanstack/react-query';
import { SelectCollection } from '@/db/schema';
import { MdAddCircleOutline } from 'react-icons/md';
import { TableRowSelection } from 'antd/es/table/interface';
import { SearchOutlined, FilterOutlined, ClearOutlined, CloseOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';

interface Server {
  id: number;
  hostname: string;
  ipv4: string | null;
  description: string | null;
  osId?: number;
  osName?: string;
  projectId?: number;
  projectName?: string; 
  businessId?: number;
  businessName?: string;
  locationId?: number;
  locationName?: string;
}

interface ActionResult {
  success: boolean;
  message?: string;
}

interface AddServersToCollectionProps {
  collection: SelectCollection;
}

interface FilterOptions {
  osIds?: number[];
  projectIds?: number[];
  businessIds?: number[];
  locationIds?: number[];
}

const AddServersToCollection: React.FC<AddServersToCollectionProps> = ({ collection }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedServerIds, setSelectedServerIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [serversInCollection, setServersInCollection] = useState<Set<number>>(new Set());

  // Create server filter for API
  const createServerFilter = (): ServerFilter => {
    const apiFilter: ServerFilter = {};
    
    if (searchTerm) {
      apiFilter.search = searchTerm;
    }
    
    // For API compatibility, the multi-select filter state needs to be mapped differently
    // For now, we'll handle the multi-select filtering on the client side
    
    return apiFilter;
  };

  // Fetch all servers with their related data
  const { data: serverData, isLoading: isLoadingServers, refetch: refetchServers } = useQuery({
    queryKey: ['all-servers', searchTerm],
    queryFn: async () => {
      return getServers(
        createServerFilter(),
        { field: 'hostname', direction: 'asc' },
        { page: 1, pageSize: 1000 } // Get all servers to filter client-side
      );
    },
    enabled: isModalOpen,
  });

  // Query for servers in this collection to exclude them
  const { data: collectionServersData } = useQuery({
    queryKey: ['servers-in-collection', collection.id],
    queryFn: async () => {
      return getServers(
        { collectionId: collection.id },
        { field: 'hostname', direction: 'asc' },
        { page: 1, pageSize: 1000 }
      );
    },
    enabled: isModalOpen,
    onSuccess: (data) => {
      // Create a set of server IDs in the collection for fast lookups
      const serverIds = new Set(data.data.map(server => server.id));
      setServersInCollection(serverIds);
    }
  });

  // Fetch filter options
  const { data: osOptions = [] } = useQuery({
    queryKey: ['osOptions'],
    queryFn: getOSOptions,
    enabled: isModalOpen,
  });

  const { data: projectOptions = [] } = useQuery({
    queryKey: ['projectOptions'],
    queryFn: getProjectOptions,
    enabled: isModalOpen,
  });

  const { data: businessOptions = [] } = useQuery({
    queryKey: ['businessOptions'],
    queryFn: getBusinessOptions,
    enabled: isModalOpen,
  });

  const { data: locationOptions = [] } = useQuery({
    queryKey: ['locationOptions'],
    queryFn: getLocationOptions,
    enabled: isModalOpen,
  });
  
  // Count active filters
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.osIds?.length) count++;
    if (filters.projectIds?.length) count++;
    if (filters.businessIds?.length) count++;
    if (filters.locationIds?.length) count++;
    return count;
  };
  
  const activeFilterCount = getActiveFilterCount();
  
  // Using a ref for storing notification config to avoid calling during render
  const notificationConfig = React.useRef<{
    type: 'success' | 'error' | 'warning';
    message: string;
    description: string;
  } | null>(null);

  // Filter servers based on all criteria
  const filteredServers = React.useMemo(() => {
    if (!serverData?.data) return [];
    
    // Start with all servers that are not in the collection
    let filtered = serverData.data.filter(server => !serversInCollection.has(server.id));
    
    // Apply dropdown filters (multi-select)
    if (filters.osIds?.length > 0) {
      filtered = filtered.filter(server => 
        server.osId !== undefined && filters.osIds?.includes(server.osId)
      );
    }
    
    if (filters.projectIds?.length > 0) {
      filtered = filtered.filter(server => 
        server.projectId !== undefined && filters.projectIds?.includes(server.projectId)
      );
    }
    
    if (filters.businessIds?.length > 0) {
      filtered = filtered.filter(server => 
        server.businessId !== undefined && filters.businessIds?.includes(server.businessId)
      );
    }
    
    if (filters.locationIds?.length > 0) {
      filtered = filtered.filter(server => 
        server.locationId !== undefined && filters.locationIds?.includes(server.locationId)
      );
    }

    return filtered;
  }, [serverData?.data, serversInCollection, filters]);

  // First effect to update notification config but not trigger API calls during render
  useEffect(() => {
    if (actionResult) {
      if (actionResult.success) {
        const count = selectedServerIds.length;
        notificationConfig.current = {
          type: 'success',
          message: 'Success',
          description: `${count} server(s) added to collection`
        };
        
        // Close modal and reset selection first
        setSelectedServerIds([]);
        setIsModalOpen(false);
        
        // Reset search and filters
        setSearchTerm('');
        setFilters({});
        
        // Invalidate all queries to force a complete refresh
        queryClient.invalidateQueries();
        
        // Explicitly invalidate these specific queries to ensure UI updates
        queryClient.invalidateQueries({ queryKey: ['servers'] });
        queryClient.refetchQueries({ queryKey: ['servers'] });
        
        // Use a timeout to ensure the server-side changes are complete
        setTimeout(() => {
          // Explicitly invalidate these specific queries to ensure UI updates
          queryClient.invalidateQueries({ queryKey: ['collections'] });
          queryClient.invalidateQueries({ queryKey: ['collection', collection.id] });
          queryClient.invalidateQueries({ queryKey: ['collection-servers', collection.id] });
        }, 500);
      } else {
        notificationConfig.current = {
          type: 'error',
          message: 'Error',
          description: actionResult.message || 'Failed to add servers to collection'
        };
      }
      
      // Reset the result after handling
      setActionResult(null);
    }
  }, [actionResult, queryClient, collection.id, selectedServerIds.length]);

  // Handle warning message
  useEffect(() => {
    if (warningMessage) {
      notificationConfig.current = {
        type: 'warning',
        message: 'No Servers Selected',
        description: warningMessage
      };
      setWarningMessage(null);
    }
  }, [warningMessage]);
  
  // Second effect to handle the actual notification API calls
  useEffect(() => {
    if (notificationConfig.current) {
      const { type, message: msg, description } = notificationConfig.current;
      
      switch (type) {
        case 'success':
          notification.success({
            message: msg,
            description,
            duration: 3,
          });
          break;
        case 'error':
          notification.error({
            message: msg,
            description,
            duration: 3,
          });
          break;
        case 'warning':
          notification.warning({
            message: msg,
            description,
            duration: 3,
          });
          break;
      }
      
      notificationConfig.current = null;
    }
  }, [notification, actionResult, warningMessage]);

  const showModal = () => {
    // First open the modal
    setIsModalOpen(true);
    // Then reset and reload fresh data
    setSelectedServerIds([]);
    setSearchTerm('');
    setFilters({});
    // Make sure we have the latest data
    refetchServers();
  };

  const handleCancel = () => {
    setSelectedServerIds([]);
    setIsModalOpen(false);
    setSearchTerm('');
    setFilters({});
    setIsDrawerVisible(false);
  };

  const handleSubmit = async () => {
    if (selectedServerIds.length === 0) {
      setWarningMessage('Please select at least one server to add to the collection');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting servers to add:', selectedServerIds);
      const result = await addServersToCollection(selectedServerIds, collection.id);
      console.log('Add servers result:', result);
      
      // Set result to trigger the effect
      setActionResult(result);
      
      // Immediately force React Query to refetch all data
      queryClient.invalidateQueries();
    } catch (error) {
      console.error('Error adding servers to collection:', error);
      setActionResult({
        success: false,
        message: 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter changes with multi-select
  const handleFilterChange = (key: keyof FilterOptions, value: number[]) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: value
    }));
  };

  // Clear all filters and search
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({});
  };

  // Render applied filter tags
  const renderFilterTags = () => {
    if (activeFilterCount === 0) return null;
    
    return (
      <Space wrap size={[0, 8]} className="mb-3">
        {searchTerm && (
          <Tag closable onClose={() => setSearchTerm('')}>
            Search: {searchTerm}
          </Tag>
        )}
        
        {filters.osIds?.length > 0 && filters.osIds.map(id => {
          const option = osOptions.find(o => o.id === id);
          return option && (
            <Tag 
              key={`os-${id}`} 
              closable 
              onClose={() => {
                const newIds = filters.osIds?.filter(i => i !== id) || [];
                handleFilterChange('osIds', newIds);
              }}
            >
              OS: {option.name}
            </Tag>
          );
        })}
        
        {filters.projectIds?.length > 0 && filters.projectIds.map(id => {
          const option = projectOptions.find(p => p.id === id);
          return option && (
            <Tag 
              key={`project-${id}`} 
              closable 
              onClose={() => {
                const newIds = filters.projectIds?.filter(i => i !== id) || [];
                handleFilterChange('projectIds', newIds);
              }}
            >
              Project: {option.name}
            </Tag>
          );
        })}
        
        {filters.businessIds?.length > 0 && filters.businessIds.map(id => {
          const option = businessOptions.find(b => b.id === id);
          return option && (
            <Tag 
              key={`business-${id}`} 
              closable 
              onClose={() => {
                const newIds = filters.businessIds?.filter(i => i !== id) || [];
                handleFilterChange('businessIds', newIds);
              }}
            >
              Business: {option.name}
            </Tag>
          );
        })}
        
        {filters.locationIds?.length > 0 && filters.locationIds.map(id => {
          const option = locationOptions.find(l => l.id === id);
          return option && (
            <Tag 
              key={`location-${id}`} 
              closable 
              onClose={() => {
                const newIds = filters.locationIds?.filter(i => i !== id) || [];
                handleFilterChange('locationIds', newIds);
              }}
            >
              Location: {option.name}
            </Tag>
          );
        })}
        
        {activeFilterCount > 1 && (
          <Button type="text" size="small" onClick={handleClearFilters}>
            Clear All
          </Button>
        )}
      </Space>
    );
  };

  const rowSelection: TableRowSelection<Server> = {
    selectedRowKeys: selectedServerIds,
    onChange: (selectedRowKeys) => {
      setSelectedServerIds(selectedRowKeys as number[]);
    },
  };

  const columns = [
    {
      title: 'Hostname',
      dataIndex: 'hostname',
      sorter: (a: Server, b: Server) => a.hostname.localeCompare(b.hostname),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipv4',
      render: (text: string | null) => text || '-',
    },
    {
      title: 'OS',
      dataIndex: 'osName',
      render: (text: string | null) => text || '-',
    },
    {
      title: 'Project',
      dataIndex: 'projectName',
      render: (text: string | null) => text || '-',
    },
    {
      title: 'Business',
      dataIndex: 'businessName',
      render: (text: string | null) => text || '-',
    },
    {
      title: 'Location',
      dataIndex: 'locationName',
      render: (text: string | null) => text || '-',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      render: (text: string | null) => text || '-',
    },
  ];

  return (
    <>
      <Button 
        type="primary" 
        icon={<MdAddCircleOutline />} 
        onClick={showModal}
      >
        Add Servers
      </Button>
      <Modal
        title="Add Servers to Collection"
        open={isModalOpen}
        onCancel={handleCancel}
        width={1000}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleSubmit} 
            loading={isSubmitting}
            disabled={selectedServerIds.length === 0}
          >
            Add {selectedServerIds.length} Server{selectedServerIds.length !== 1 ? 's' : ''}
          </Button>,
        ]}
      >
        <div className="mb-4">
          <p>Select servers to add to the <strong>{collection.name}</strong> collection:</p>
        </div>
        
        {/* Search and Filter button */}
        <div className="mb-4">
          <Space>
            <Input
              placeholder="Search by hostname or IP address"
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={handleSearchChange}
              style={{ width: 250 }}
            />
            
            <Button 
              icon={<FilterOutlined />} 
              onClick={() => setIsDrawerVisible(true)}
              type={activeFilterCount > 0 ? "primary" : "default"}
            >
              {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
            </Button>
          </Space>
          
          {/* Display applied filters */}
          {activeFilterCount > 0 && (
            <div className="mt-2">
              {renderFilterTags()}
            </div>
          )}
        </div>
        
        {/* Server table */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredServers.map(server => ({ ...server, key: server.id }))}
          loading={isLoadingServers}
          size="small"
          pagination={{ pageSize: 10 }}
          className="collections-table"
        />
        
        {/* Filter Drawer */}
        <Drawer
          title="Server Filters"
          placement="right"
          onClose={() => setIsDrawerVisible(false)}
          open={isDrawerVisible}
          width={320}
          footer={
            <Space>
              <Button onClick={handleClearFilters}>Clear All</Button>
              <Button type="primary" onClick={() => setIsDrawerVisible(false)}>
                Apply
              </Button>
            </Space>
          }
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <div className="mb-2 font-medium">Search</div>
              <Input
                placeholder="Search hostname or IP address"
                value={searchTerm}
                onChange={handleSearchChange}
                suffix={
                  searchTerm ? (
                    <CloseOutlined onClick={() => setSearchTerm('')} style={{ cursor: 'pointer' }} />
                  ) : (
                    <SearchOutlined />
                  )
                }
              />
            </div>
            
            <div>
              <div className="mb-2 font-medium">Operating System</div>
              <Select
                placeholder="Select OS"
                mode="multiple"
                allowClear
                style={{ width: '100%' }}
                value={filters.osIds}
                onChange={value => handleFilterChange('osIds', value)}
                options={osOptions.map(os => ({ value: os.id, label: os.name }))}
                optionFilterProp="label"
                showSearch
                maxTagCount={2}
                listHeight={200}
              />
            </div>
            
            <div>
              <div className="mb-2 font-medium">Project</div>
              <Select
                placeholder="Select Project"
                mode="multiple"
                allowClear
                style={{ width: '100%' }}
                value={filters.projectIds}
                onChange={value => handleFilterChange('projectIds', value)}
                options={projectOptions.map(project => ({ value: project.id, label: project.name }))}
                optionFilterProp="label"
                showSearch
                maxTagCount={2}
                listHeight={200}
              />
            </div>
            
            <div>
              <div className="mb-2 font-medium">Business</div>
              <Select
                placeholder="Select Business"
                mode="multiple"
                allowClear
                style={{ width: '100%' }}
                value={filters.businessIds}
                onChange={value => handleFilterChange('businessIds', value)}
                options={businessOptions.map(business => ({ value: business.id, label: business.name }))}
                optionFilterProp="label"
                showSearch
                maxTagCount={2}
                listHeight={200}
              />
            </div>
            
            <div>
              <div className="mb-2 font-medium">Location</div>
              <Select
                placeholder="Select Location"
                mode="multiple"
                allowClear
                style={{ width: '100%' }}
                value={filters.locationIds}
                onChange={value => handleFilterChange('locationIds', value)}
                options={locationOptions.map(location => ({ value: location.id, label: location.name }))}
                optionFilterProp="label"
                showSearch
                maxTagCount={2}
                listHeight={200}
              />
            </div>
          </Space>
        </Drawer>
      </Modal>
    </>
  );
};

export default AddServersToCollection;