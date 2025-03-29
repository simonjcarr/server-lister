'use client';

import React, { useState, useEffect } from 'react';
import { Card, Checkbox, List, Button, message, App, Spin } from 'antd';
import { FaHeart, FaServer } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getAllServers, updateUserFavoriteServers, getUserFavoriteServersWithDetailsDirect } from '@/app/actions/server/userServerActions';

const SimpleFavouritesPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServerIds, setSelectedServerIds] = useState<number[]>([]);

  // Load all servers and user's favorites
  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        
        // Load all servers
        const allServers = await getAllServers();
        
        // Load user's favorites using direct SQL approach
        const favorites = await getUserFavoriteServersWithDetailsDirect();
        
        // Set selected server IDs from favorites
        const favoriteIds = favorites.map(fav => fav.serverId);
        setSelectedServerIds(favoriteIds);
        
        // Set servers with checked property
        setServers(allServers.map(server => ({
          ...server,
          checked: favoriteIds.includes(server.id)
        })));
        
        console.log('Loaded servers:', allServers.length);
        console.log('Loaded favorites:', favoriteIds);
      } catch (error) {
        console.error('Error loading data:', error);
        message.error('Failed to load servers');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [session]);

  // Handle checkbox change
  const handleCheckboxChange = (serverId: number, checked: boolean) => {
    // Update the server's checked status
    setServers(prev => prev.map(server => 
      server.id === serverId ? { ...server, checked } : server
    ));
    
    // Update selected server IDs
    if (checked) {
      setSelectedServerIds(prev => [...prev, serverId]);
    } else {
      setSelectedServerIds(prev => prev.filter(id => id !== serverId));
    }
  };

  // Save favorites
  const handleSave = async () => {
    if (!session?.user?.id) {
      message.error('You must be logged in to save favourites');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Saving selected server IDs:', selectedServerIds);
      
      const result = await updateUserFavoriteServers(selectedServerIds);
      
      if (result.success) {
        message.success('Favourites saved successfully');
      } else {
        message.error(result.error || 'Failed to save favourites');
      }
    } catch (error) {
      console.error('Error saving favourites:', error);
      message.error('Failed to save favourites');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
              <span>Manage Favourite Servers (Simple View)</span>
            </div>
          }
          variant="bordered"
          className="shadow-md"
        >
          <p className="mb-4">
            Check the servers you want to add to your favourites.
          </p>
          
          <List
            dataSource={servers}
            renderItem={(server) => (
              <List.Item>
                <Checkbox 
                  checked={server.checked} 
                  onChange={(e) => handleCheckboxChange(server.id, e.target.checked)}
                >
                  <div className="flex items-center gap-2">
                    <FaServer className="text-blue-500" />
                    <div>
                      <div className="font-semibold">{server.hostname}</div>
                      <div className="text-xs text-gray-500">{server.ipv4 || 'No IP'} - {server.description || 'No description'}</div>
                    </div>
                  </div>
                </Checkbox>
              </List.Item>
            )}
          />
          
          <div className="flex justify-end mt-4">
            <Button 
              type="primary"
              onClick={handleSave}
            >
              Save Favourites
            </Button>
          </div>
        </Card>
      </div>
    </App>
  );
};

export default SimpleFavouritesPage;