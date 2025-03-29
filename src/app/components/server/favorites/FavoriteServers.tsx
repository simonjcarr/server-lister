'use client';

import React from 'react';
import { Card, List, Skeleton, Empty, Button, App } from 'antd';
import { FaExternalLinkAlt, FaHeart } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserFavoriteServersWithDetails, debugDumpUserServers, getUserFavoriteServersWithDetailsDirect } from '@/app/actions/server/userServerActions';

interface FavoriteServer {
  id: number;
  serverId: number;
  userId: string;
  createdAt: string;
  server: {
    id: number;
    hostname: string;
    ipv4: string | null;
    description: string | null;
  };
}

const FavoriteServers: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Initialize with an empty state for pre-rendering
  const [favoritesList, setFavoritesList] = React.useState<FavoriteServer[]>([]);

  // Debug function to dump database contents
  React.useEffect(() => {
    const dumpDebugData = async () => {
      if (session) {
        console.log('⚠️ DUMPING DATABASE DEBUG INFO ⚠️');
        const debugData = await debugDumpUserServers();
        console.log('Debug data result:', debugData);
      }
    };
    
    dumpDebugData();
  }, [session]);
  
  // Force a direct database fetch to ensure we're showing the latest data
  React.useEffect(() => {
    const fetchDirectly = async () => {
      if (session?.user?.id) {
        try {
          // Direct SQL database query
          const favorites = await getUserFavoriteServersWithDetailsDirect();
          console.log('Direct database fetch found:', favorites.length, 'favorites');
          if (favorites.length > 0) {
            setFavoritesList(favorites as FavoriteServer[]);
          }
        } catch (error) {
          console.error('Error in direct fetch:', error);
        }
      }
    };
    
    fetchDirectly();
    // Run this initially and every 5 seconds to ensure we have the latest data
    const interval = setInterval(fetchDirectly, 5000);
    
    return () => clearInterval(interval);
  }, [session]);

  // Use Tanstack Query to fetch favorite servers
  const { data: favorites = [], isLoading, refetch } = useQuery({
    queryKey: ['favoriteServers'],
    queryFn: async () => {
      console.log('UserID from session:', session?.user?.id);
      console.log('Fetching favorite servers for home component');
      const result = await getUserFavoriteServersWithDetails();
      console.log('Favorite servers fetched for home:', result);
      if (result.length === 0) {
        console.log('No favorites found - check if user has any saved favorites');
      } else {
        console.log('Favorites found:', result.length);
        console.log('First favorite:', result[0]);
      }
      setFavoritesList(result as FavoriteServer[]);
      return result as FavoriteServer[];
    },
    enabled: !!session, // Only run query if user is logged in
    staleTime: 10000, // 10 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
  
  // Use a separate query for direct SQL approach
  const { data: directFavorites = [] } = useQuery({
    queryKey: ['favoriteServers_direct'],
    queryFn: async () => {
      console.log('Fetching favorite servers using direct SQL approach');
      const result = await getUserFavoriteServersWithDetailsDirect();
      console.log('Direct SQL approach results:', result);
      if (result.length > 0) {
        setFavoritesList(result as FavoriteServer[]);
      }
      return result as FavoriteServer[];
    },
    enabled: !!session,
    staleTime: 5000,
  });
  
  // Refetch data on component mount
  React.useEffect(() => {
    if (session) {
      console.log('Component mounted, refetching favorites');
      queryClient.invalidateQueries({ queryKey: ['favoriteServers'] });
      queryClient.invalidateQueries({ queryKey: ['favoriteServers_direct'] });
      refetch();
    }
  }, [session, refetch, queryClient]);
  
  // Debug useEffect for favorites changes
  React.useEffect(() => {
    console.log('Favorites changed:', favorites.length);
    console.log('Direct favorites:', directFavorites.length);
    console.log('Favorites list state:', favoritesList.length);
  }, [favorites, directFavorites, favoritesList]);

  const handleManageFavorites = () => {
    router.push('/server/favourites');
  };

  if (isLoading) {
    return (
      <App>
        <Card
        title={
          <div className="flex items-center gap-2">
            <FaHeart className="text-red-500" />
            <span>Favourite Servers</span>
          </div>
        }
        extra={<Button onClick={handleManageFavorites}>Manage</Button>}
        variant="bordered"
        className="shadow-sm"
      >
        <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </App>
    );
  }

  // Choose the data source - try all available sources in order of preference
  const displayData = favorites.length > 0 ? favorites : 
                      directFavorites.length > 0 ? directFavorites : 
                      favoritesList;

  return (
    <App>
      <Card
      title={
        <div className="flex items-center gap-2">
          <FaHeart className="text-red-500" />
          <span>Favourite Servers</span>
        </div>
      }
      extra={<Button onClick={handleManageFavorites}>Manage</Button>}
      variant="bordered"
      className="shadow-sm"
    >
      {displayData.length === 0 ? (
        <Empty 
          description="No favourite servers yet" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      ) : (
        <List
          dataSource={displayData}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Link key="view" href={`/server/view/${item.serverId}`}>
                  <FaExternalLinkAlt className="text-blue-500" />
                </Link>,
              ]}
            >
              <List.Item.Meta
                title={item.server.hostname}
                description={
                  <div>
                    <div>{item.server.ipv4 || 'No IP'}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {item.server.description || 'No description'}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
      </Card>
    </App>
  );
};

export default FavoriteServers;