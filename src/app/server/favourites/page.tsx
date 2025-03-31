'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Transfer, Spin, App, Alert } from 'antd';
import { TransferProps } from 'antd/es/transfer';
import { useSession } from 'next-auth/react';
import { FaHeart, FaServer } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllServers, updateUserFavoriteServers, getFavoriteServerIds } from '@/app/actions/server/userServerActions';

interface TransferItem {
  key: string;
  title: string;
  description: string;
}

// Main content component that uses the App context for message API
const FavouritesPageContent = () => {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const { message } = App.useApp();
  
  // Handle mutation errors in the UI
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Query to get all servers
  const { data: allServers = [], isLoading: isLoadingServers } = useQuery({
    queryKey: ['allServers'],
    queryFn: async () => {
      const result = await getAllServers();
      return result;
    },
    enabled: status === 'authenticated',
  });

  // Query to get user's favorite server IDs (simpler approach)
  const { data: favoriteServerIds = [], isLoading: isLoadingUserServers } = useQuery({
    queryKey: ['favoriteServerIds'],
    queryFn: async () => {
      return await getFavoriteServerIds();
    },
    enabled: !!session,
  });

  // Set targetKeys when favoriteServerIds data loads
  useEffect(() => {
    if (favoriteServerIds && Array.isArray(favoriteServerIds) && favoriteServerIds.length > 0) {
      // Convert to strings since the Transfer component expects string keys
      const serverIdStrings = favoriteServerIds.map(id => (typeof id === 'number' ? id.toString() : String(id)));
      setTargetKeys(serverIdStrings);
    }
  }, [favoriteServerIds]);

  // Mutation to update favorite servers
  const { mutate: updateFavorites } = useMutation({
    mutationFn: async (serverIds: string[]) => {
      // Convert string IDs to numbers
      const numericIds = serverIds.map(id => parseInt(id, 10));
      return await updateUserFavoriteServers(numericIds);
    },
    onSuccess: () => {
      message.success('Favourite servers updated successfully');
      queryClient.invalidateQueries({ queryKey: ['favoriteServerIds'] });
      // Clear any previous error
      setMutationError(null);
    },
    onError: (error) => {
      console.error('Favorites update error:', error);
      message.error(`Error updating favorites: ${error?.message || 'Unknown error'}`);
      // Set the error message for display in the UI
      setMutationError(error?.message || 'Failed to update favorites. Please try again.');
    },
  });

  const onChange: TransferProps['onChange'] = (nextTargetKeys) => {
    // Convert nextTargetKeys to string[] as that's what our state expects
    setTargetKeys(nextTargetKeys.map(key => String(key)));
    
    // Immediately save when changed (just like in PrimaryEngineerTab)
    if (session?.user?.id) {
      // Convert to string[] before passing to updateFavorites
      updateFavorites(nextTargetKeys.map(key => String(key)));
    } else {
      message.error('You must be logged in to save favourites');
    }
  };

  const filterOption = (inputValue: string, item: TransferItem) => {
    return (
      item.title.indexOf(inputValue) !== -1 || 
      (item.description && item.description.indexOf(inputValue) !== -1) || 
      false
    );
  };

interface ServerData {
  id: number;
  hostname: string;
  ipv4: string | null;
  description: string | null;
}

  // Format servers for Transfer component
  const serverItems = Array.isArray(allServers) 
    ? allServers.map((server: ServerData) => ({
        key: server.id.toString(),
        title: server.hostname || 'Unnamed Server',
        description: `${server.ipv4 || 'No IP'} - ${server.description || 'No description'}`,
      }))
    : [];

  const isLoading = isLoadingServers || isLoadingUserServers;

  // Query error state handler
  const queryState = useQueryClient().getQueryState(['allServers']);
  const isQueryError = queryState ? queryState.status === 'error' : false;
  const queryError = queryState ? queryState.error : undefined;

  if (isQueryError) {
    return (
      <div className="container mx-auto p-4">
        <Alert
          message="Error Loading Servers"
          description={
            <div>
              <p>There was a problem loading the server data. Please try again later.</p>
              <p className="text-gray-500 text-sm mt-2">{queryError?.message || 'Unknown error'}</p>
            </div>
          }
          type="error"
          className="mb-4"
        />
        <Button type="primary" onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }

  // Loading state handler
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card 
      title={
        <div className="flex items-center gap-2">
          <FaHeart className="text-red-500" />
          <span>Manage Favourite Servers</span>
        </div>
      }
      variant="outlined"
      className="shadow-md"
    >
      <p className="mb-4">
        Add servers to your favourites for quick access to the servers you work with regularly.
      </p>
      
      {/* Error message in case there are issues with the mutation */}
      {mutationError && (
        <Alert
          message="Error Updating Favorites"
          description={mutationError}
          type="error"
          className="mb-4"
          closable
          onClose={() => setMutationError(null)}
        />
      )}
      
      <Transfer
        dataSource={serverItems}
        titles={['Available Servers', 'Favourite Servers']}
        targetKeys={targetKeys}
        onChange={onChange}
        filterOption={filterOption}
        showSearch
        listStyle={{
          width: '100%',
          height: 500,
        }}
        operations={['Add to favourites', 'Remove from favourites']}
        render={(item) => (
          <div className="flex items-center gap-2">
            <FaServer className="text-blue-500" />
            <div>
              <div className="font-semibold">{item.title}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </div>
          </div>
        )}
        locale={{
          itemUnit: 'server',
          itemsUnit: 'servers',
          searchPlaceholder: 'Search servers...',
        }}
      />
      </Card>
    </div>
  );
};

// Wrapper component that provides the App context for Ant Design theming and message API
const FavouriteServersPage = () => {
  return (
    <App>
      <FavouritesPageContent />
    </App>
  );
};

export default FavouriteServersPage;