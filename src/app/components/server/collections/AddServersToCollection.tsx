'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { App, Button, Modal, Table } from 'antd';
import { addServersToCollection, getServersNotInCollection } from '@/app/actions/server/collectionActions';
import { useQueryClient } from '@tanstack/react-query';
import { SelectCollection } from '@/db/schema';
import { MdAddCircleOutline } from 'react-icons/md';
import { TableRowSelection } from 'antd/es/table/interface';

interface Server {
  id: number;
  hostname: string;
  ipv4: string | null;
  description: string | null;
}

interface ActionResult {
  success: boolean;
  message?: string;
}

interface AddServersToCollectionProps {
  collection: SelectCollection;
}

const AddServersToCollection: React.FC<AddServersToCollectionProps> = ({ collection }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableServers, setAvailableServers] = useState<Server[]>([]);
  const [selectedServerIds, setSelectedServerIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const { notification: api } = App.useApp();
  const queryClient = useQueryClient();

  // Handle notifications directly in effect
  useEffect(() => {
    if (actionResult) {
      if (actionResult.success) {
        const count = selectedServerIds.length;
        api.success({
          message: 'Success',
          description: `${count} server(s) added to collection`,
          duration: 3,
        });
        
        // Close modal and reset selection first
        setSelectedServerIds([]);
        setIsModalOpen(false);
        
        // Invalidate all queries to force a complete refresh
        queryClient.invalidateQueries();
        
        // Use a timeout to ensure the server-side changes are complete
        setTimeout(() => {
          // Explicitly invalidate these specific queries to ensure UI updates
          queryClient.invalidateQueries({ queryKey: ['collections'] });
          queryClient.invalidateQueries({ queryKey: ['collection', collection.id] });
          queryClient.invalidateQueries({ queryKey: ['collection-servers', collection.id] });
        }, 500);
      } else {
        api.error({
          message: 'Error',
          description: actionResult.message || 'Failed to add servers to collection',
          duration: 3,
        });
      }
      
      // Reset the result after handling
      setActionResult(null);
    }
  }, [actionResult, queryClient, collection.id, selectedServerIds.length, api]);

  // Handle warning message
  useEffect(() => {
    if (warningMessage) {
      api.warning({
        message: 'No Servers Selected',
        description: warningMessage,
        duration: 3,
      });
      setWarningMessage(null);
    }
  }, [warningMessage, api]);

  const loadServers = async () => {
    setLoading(true);
    try {
      // Force fetch fresh data every time
      console.log('Loading servers not in collection:', collection.id);
      const servers = await getServersNotInCollection(collection.id);
      console.log('Servers not in collection:', servers);
      setAvailableServers(servers);
    } catch (error) {
      console.error('Error loading servers:', error);
      api.error({
        message: 'Error',
        description: 'Failed to load available servers',
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  const showModal = () => {
    // First open the modal
    setIsModalOpen(true);
    // Then reset and reload fresh data
    setAvailableServers([]);
    setSelectedServerIds([]);
    // Small delay to ensure state is updated before loading servers
    setTimeout(() => {
      loadServers();
    }, 100);
  };

  const handleCancel = () => {
    setSelectedServerIds([]);
    setIsModalOpen(false);
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
        width={800}
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
        
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={availableServers.map(server => ({ ...server, key: server.id }))}
          loading={loading}
          size="small"
          pagination={{ pageSize: 10 }}
          className="collections-table"
        />
      </Modal>
    </>
  );
};

export default AddServersToCollection;