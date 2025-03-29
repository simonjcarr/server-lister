'use client';

import React, { useEffect, useState } from 'react';
import { Button, Card, Transfer, message, Spin } from 'antd';
import { TransferDirection } from 'antd/es/transfer';
import { useSession } from 'next-auth/react';
import { redirectToSignIn } from '@auth/nextjs-pages';
import { FaHeart, FaServer } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface ServerItem {
  key: string;
  title: string;
  description: string;
  disabled: boolean;
}

const FavoriteServersPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverList, setServerList] = useState<ServerItem[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirectToSignIn();
    }

    if (status === 'authenticated') {
      fetchServers();
    }
  }, [status]);

  const fetchServers = async () => {
    try {
      // Fetch all servers
      const allServersRes = await fetch('/api/servers');
      const allServers = await allServersRes.json();

      // Fetch user's favorite servers
      const favoritesRes = await fetch('/api/servers/favorites');
      const favorites = await favoritesRes.json();

      // Format servers for Transfer component
      const serverItems: ServerItem[] = allServers.map((server: any) => ({
        key: server.id.toString(),
        title: server.hostname,
        description: `${server.ipv4 || 'No IP'} - ${server.description || 'No description'}`,
        disabled: false,
      }));

      setServerList(serverItems);
      
      // Set the target keys to the user's favorited servers
      const favoriteIds = favorites.map((fav: any) => fav.serverId.toString());
      setTargetKeys(favoriteIds);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching servers:', error);
      message.error('Failed to load servers');
      setLoading(false);
    }
  };

  const handleChange = (newTargetKeys: string[]) => {
    setTargetKeys(newTargetKeys);
  };

  const handleSave = async () => {
    if (!session?.user?.id) {
      message.error('You must be logged in to save favorites');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/servers/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverIds: targetKeys.map(id => parseInt(id)),
        }),
      });

      if (response.ok) {
        message.success('Favorite servers updated successfully');
        router.refresh();
      } else {
        message.error('Failed to update favorite servers');
      }
    } catch (error) {
      console.error('Error saving favorites:', error);
      message.error('An error occurred while saving your favorites');
    } finally {
      setSaving(false);
    }
  };

  const filterOption = (inputValue: string, item: ServerItem) => {
    return item.title.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 || 
           item.description.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1;
  };

  if (loading) {
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
            <span>Manage Favorite Servers</span>
          </div>
        }
        bordered={false}
        className="shadow-md"
      >
        <p className="mb-4">
          Add servers to your favorites for quick access to the servers you work with regularly.
        </p>
        
        <Transfer
          dataSource={serverList}
          titles={['Available Servers', 'Favorite Servers']}
          targetKeys={targetKeys}
          onChange={handleChange}
          filterOption={filterOption}
          showSearch
          listStyle={{
            width: '100%',
            height: 500,
          }}
          operations={['Add to favorites', 'Remove from favorites']}
          render={(item) => (
            <div className="flex items-center gap-2">
              <FaServer className="text-blue-500" />
              <div>
                <div className="font-semibold">{item.title}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </div>
          )}
        />
        
        <div className="flex justify-end mt-4">
          <Button 
            type="primary" 
            loading={saving} 
            onClick={handleSave}
          >
            Save Favorites
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default FavoriteServersPage;
