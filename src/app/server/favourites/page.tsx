'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Transfer, message, Spin, App } from 'antd';
import { TransferDirection, TransferProps } from 'antd/es/transfer';
import { useSession } from 'next-auth/react';
import { FaHeart, FaServer } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllServers, getUserFavoriteServersWithDetailsDirect, updateUserFavoriteServers, getFavoriteServerIds } from '@/app/actions/server/userServerActions';

interface ServerItem {
  key: string;
  title: string;
  description: string;
  disabled: boolean;
}

const FavouriteServersPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [targetKeys, setTargetKeys] = useState<string[]>([]);

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
    if (favoriteServerIds && favoriteServerIds.length > 0) {
      // Convert to strings since the Transfer component expects string keys
      const serverIdStrings = favoriteServerIds.map(id => id.toString());
      console.log('Setting target keys from favoriteServerIds:', serverIdStrings);
      setTargetKeys(serverIdStrings);
    } else {
      console.log('No favorite server IDs found or array is empty:', favoriteServerIds);
    }
  }, [favoriteServerIds]);
  
  // Also fetch the detailed server info for debugging
  const { data: favoriteServers = [] } = useQuery({
    queryKey: ['favoriteServersDetails'],
    queryFn: async () => {
      return await getUserFavoriteServersWithDetailsDirect();
    },
    enabled: !!session,
  });

  // Mutation to update favorite servers
  const { mutate: updateFavorites, isPending } = useMutation({
    mutationFn: async (serverIds: string[]) => {
      // Convert string IDs to numbers
      const numericIds = serverIds.map(id => parseInt(id, 10));
      return await updateUserFavoriteServers(numericIds);
    },
    onSuccess: () => {
      message.success('Favourite servers updated successfully');
      queryClient.invalidateQueries({ queryKey: ['favoriteServerIds'] });
      queryClient.invalidateQueries({ queryKey: ['favoriteServersDetails'] });
    },
    onError: () => {
      message.error('An error occurred while saving your favourites');
    },
  });

  const onChange: TransferProps['onChange'] = (nextTargetKeys) => {
    console.log('Transfer onChange:', nextTargetKeys);
    setTargetKeys(nextTargetKeys);
  };

  const handleSave = () => {
    if (!session?.user?.id) {
      message.error('You must be logged in to save favourites');
      return;
    }

    console.log('Saving target keys:', targetKeys);
    updateFavorites(targetKeys);
  };

  const filterOption = (inputValue: string, item: any) => {
    return item.title.indexOf(inputValue) !== -1 || 
           (item.description && item.description.indexOf(inputValue) !== -1);
  };

  // Format servers for Transfer component
  const serverItems = allServers.map((server: any) => ({
    key: server.id.toString(),
    title: server.hostname || 'Unnamed Server',
    description: `${server.ipv4 || 'No IP'} - ${server.description || 'No description'}`,
  }));

  const isLoading = isLoadingServers || isLoadingUserServers;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <App>
      <div className="container mx-auto p-4">
        <Card 
        title={
          <div className="flex items-center gap-2">
            <FaHeart className="text-red-500" />
            <span>Manage Favourite Servers</span>
          </div>
        }
        variant="bordered"
        className="shadow-md"
      >
        <p className="mb-4">
          Add servers to your favourites for quick access to the servers you work with regularly.
        </p>
        
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
        
        <div className="flex justify-end mt-4">
          <Button 
            type="primary" 
            loading={isPending} 
            onClick={handleSave}
          >
            Save Favourites
          </Button>
        </div>
        </Card>
        
        <Card className="mt-6">
          <p>Debug Information:</p>
          <p><strong>Target Keys:</strong> {targetKeys.join(', ') || 'None'}</p>
          <p><strong>Available Server IDs:</strong> {serverItems.map(s => s.key).join(', ') || 'None'}</p>
          <p><strong>Raw Favorite Server IDs:</strong> {favoriteServerIds.map(id => id.toString()).join(', ') || 'None'}</p>
          <p><strong>Favorite Servers Count:</strong> {favoriteServers?.length || 0}</p>
          <p><strong>Favorite IDs from Database (Details):</strong> 
            {favoriteServers && favoriteServers.length > 0 
              ? favoriteServers.map(f => {
                  // Try all possible property names
                  const id = f.serverId || f.serverid || f.server_id || f.serverId;
                  return id?.toString() || 'undefined';
                }).join(', ') 
              : 'None'}
          </p>
          <p><strong>First Favorite Server Object:</strong></p>
          <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
            {JSON.stringify(favoriteServers?.[0] || 'No favorites', null, 2)}
          </pre>
          <p><strong>First Server Item:</strong></p>
          <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
            {JSON.stringify(serverItems[0] || 'No items', null, 2)}
          </pre>
        </Card>
      </div>
    </App>
  );
};

export default FavouriteServersPage;