'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Transfer, message, Spin, App } from 'antd';
import { TransferProps } from 'antd/es/transfer';
import { useSession } from 'next-auth/react';
import { FaHeart, FaServer } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllServers, updateUserFavoriteServers, getFavoriteServerIds } from '@/app/actions/server/userServerActions';

interface ServerItem {
  key: string;
  title: string;
  description: string;
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
      setTargetKeys(serverIdStrings);
    }
  }, [favoriteServerIds]);

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
    },
    onError: () => {
      message.error('An error occurred while saving your favourites');
    },
  });

  const onChange: TransferProps['onChange'] = async (nextTargetKeys) => {
    setTargetKeys(nextTargetKeys);
    
    // Immediately save when changed (just like in PrimaryEngineerTab)
    if (session?.user?.id) {
      await updateFavorites(nextTargetKeys);
    } else {
      message.error('You must be logged in to save favourites');
    }
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
        </Card>
      </div>
    </App>
  );
};

export default FavouriteServersPage;