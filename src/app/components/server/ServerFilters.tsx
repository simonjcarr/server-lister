'use client'

import React, { useState } from 'react'
import { Input, Select, Checkbox, Button, Space, Drawer, Tag, Divider } from 'antd'
import { FilterOutlined, SearchOutlined, CloseOutlined, HeartOutlined, ReloadOutlined } from '@ant-design/icons'
import { ServerFilter } from '@/app/actions/server/crudActions'

interface ServerFiltersProps {
  filters: ServerFilter
  onFilterChange: (key: keyof ServerFilter, value: number | string | undefined) => void
  searchText: string
  onSearchTextChange: (text: string) => void
  onSearch: () => void
  onClearFilters: () => void
  onRefresh: () => void
  showFavoritesOnly: boolean
  onFavoritesToggle: (value: boolean) => void
  businessOptions: Array<{ id: number; name: string }>
  projectOptions: Array<{ id: number; name: string }>
  osOptions: Array<{ id: number; name: string }>
  locationOptions: Array<{ id: number; name: string }>
  collectionOptions: Array<{ id: number; name: string }>
  hasSession: boolean
}

const ServerFilters: React.FC<ServerFiltersProps> = ({
  filters,
  onFilterChange,
  searchText,
  onSearchTextChange,
  onSearch,
  onClearFilters,
  onRefresh,
  showFavoritesOnly,
  onFavoritesToggle,
  businessOptions,
  projectOptions,
  osOptions,
  locationOptions,
  collectionOptions,
  hasSession,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false)

  // Get active filter count
  const getActiveFilterCount = (): number => {
    let count = 0
    if (searchText) count++
    if (showFavoritesOnly) count++
    if (filters.businessId) count++
    if (filters.projectId) count++
    if (filters.osId) count++
    if (filters.locationId) count++
    if (filters.collectionId) count++
    if (filters.onboardingStatus) count++
    return count
  }
  
  const activeFilterCount = getActiveFilterCount()

  // Create applied filter tags
  const renderFilterTags = () => {
    if (activeFilterCount === 0) return null
    
    return (
      <Space wrap size={[0, 8]}>
        {searchText && (
          <Tag closable onClose={() => onSearchTextChange('')}>
            Search: {searchText}
          </Tag>
        )}
        
        {showFavoritesOnly && (
          <Tag 
            closable 
            onClose={() => onFavoritesToggle(false)}
            icon={<HeartOutlined />}
            color="pink"
          >
            Favorites Only
          </Tag>
        )}
        
        {filters.businessId && (
          <Tag closable onClose={() => onFilterChange('businessId', undefined)}>
            Business: {businessOptions.find(b => b.id === filters.businessId)?.name}
          </Tag>
        )}
        
        {filters.projectId && (
          <Tag closable onClose={() => onFilterChange('projectId', undefined)}>
            Project: {projectOptions.find(p => p.id === filters.projectId)?.name}
          </Tag>
        )}
        
        {filters.osId && (
          <Tag closable onClose={() => onFilterChange('osId', undefined)}>
            OS: {osOptions.find(o => o.id === filters.osId)?.name}
          </Tag>
        )}
        
        {filters.locationId && (
          <Tag closable onClose={() => onFilterChange('locationId', undefined)}>
            Location: {locationOptions.find(l => l.id === filters.locationId)?.name}
          </Tag>
        )}
        
        {filters.collectionId && (
          <Tag closable onClose={() => onFilterChange('collectionId', undefined)} color="blue">
            Collection: {collectionOptions.find(c => c.id === filters.collectionId)?.name}
          </Tag>
        )}
        
        {filters.onboardingStatus && (
          <Tag 
            closable 
            onClose={() => onFilterChange('onboardingStatus', undefined)}
            color={filters.onboardingStatus === 'not_onboarded' ? 'gold' : 'green'}
          >
            {filters.onboardingStatus === 'not_onboarded' ? 'New Servers' : 'Onboarded Servers'}
          </Tag>
        )}
        
        {activeFilterCount > 1 && (
          <Button type="text" size="small" onClick={onClearFilters}>
            Clear All
          </Button>
        )}
      </Space>
    )
  }

  // Compact search input always visible
  const renderCompactSearch = () => (
    <Space>
      <Input
        placeholder="Search hostname, IP, description"
        value={searchText}
        onChange={e => onSearchTextChange(e.target.value)}
        onPressEnter={onSearch}
        style={{ width: 250 }}
        suffix={
          <Button type="text" icon={<SearchOutlined />} onClick={onSearch} />
        }
      />
      
      <Button 
        icon={<FilterOutlined />} 
        onClick={() => setDrawerVisible(true)}
        type={activeFilterCount > 0 ? "primary" : "default"}
      >
        {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
      </Button>
      
      <Button
        icon={<ReloadOutlined />}
        onClick={onRefresh}
      >
        Refresh
      </Button>
    </Space>
  )

  return (
    <div className="mb-4">
      {renderCompactSearch()}
      {renderFilterTags() && (
        <div className="mt-2">
          {renderFilterTags()}
        </div>
      )}
      
      <Drawer
        title="Server Filters"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={320}
        footer={
          <Space>
            <Button onClick={onClearFilters}>Clear All</Button>
            <Button type="primary" onClick={() => setDrawerVisible(false)}>
              Apply
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <div className="mb-2 font-medium">Basic Filters</div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                placeholder="Search hostname, IP, description"
                value={searchText}
                onChange={e => onSearchTextChange(e.target.value)}
                onPressEnter={onSearch}
                suffix={
                  searchText ? (
                    <CloseOutlined onClick={() => onSearchTextChange('')} style={{ cursor: 'pointer' }} />
                  ) : (
                    <SearchOutlined />
                  )
                }
              />
              
              {hasSession && (
                <Checkbox
                  checked={showFavoritesOnly}
                  onChange={e => onFavoritesToggle(e.target.checked)}
                >
                  <Space>
                    <HeartOutlined style={{ color: showFavoritesOnly ? '#ff4d4f' : undefined }} />
                    Favorites Only
                  </Space>
                </Checkbox>
              )}
            </Space>
          </div>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <div>
            <div className="mb-2 font-medium">Categories</div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                placeholder="Business"
                style={{ width: '100%' }}
                allowClear
                value={filters.businessId}
                onChange={value => onFilterChange('businessId', value)}
                options={businessOptions.map(b => ({ value: b.id, label: b.name }))}
              />
              
              <Select
                placeholder="Project"
                style={{ width: '100%' }}
                allowClear
                value={filters.projectId}
                onChange={value => onFilterChange('projectId', value)}
                options={projectOptions.map(p => ({ value: p.id, label: p.name }))}
              />
              
              <Select
                placeholder="OS"
                style={{ width: '100%' }}
                allowClear
                value={filters.osId}
                onChange={value => onFilterChange('osId', value)}
                options={osOptions.map(o => ({ value: o.id, label: o.name }))}
              />
              
              <Select
                placeholder="Location"
                style={{ width: '100%' }}
                allowClear
                value={filters.locationId}
                onChange={value => onFilterChange('locationId', value)}
                options={locationOptions.map(l => ({ value: l.id, label: l.name }))}
              />
            </Space>
          </div>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <div>
            <div className="mb-2 font-medium">Onboarding Status</div>
            <Select
              placeholder="All Servers"
              style={{ width: '100%' }}
              value={filters.onboardingStatus || 'all'}
              onChange={value => onFilterChange('onboardingStatus', value === 'all' ? undefined : value)}
              options={[
                { value: 'all', label: 'All Servers' },
                { value: 'not_onboarded', label: 'New Servers (Not Onboarded)' },
                { value: 'onboarded', label: 'Onboarded Servers' }
              ]}
            />
          </div>

          <Divider style={{ margin: '12px 0' }} />
          
          <div>
            <div className="mb-2 font-medium">Collections</div>
            <Select
              placeholder="Collection"
              style={{ width: '100%' }}
              allowClear
              value={filters.collectionId}
              onChange={value => onFilterChange('collectionId', value)}
              options={collectionOptions.map(c => ({ value: c.id, label: c.name }))}
            />
          </div>
        </Space>
      </Drawer>
    </div>
  )
}

export default ServerFilters
