'use client';

import React from 'react';
import { Card, List, Skeleton, Empty, Button, App } from 'antd';
import { FaExternalLinkAlt, FaHeart } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserFavoriteServersWithDetails, getUserFavoriteServersWithDetailsDirect } from '@/app/actions/server/userServerActions';

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
  
  // Force a direct database fetch to ensure we're showing the latest data
  React.useEffect(() => {
    const fetchDirectly = async () => {
      if (session?.user?.id) {
        try {
          // Direct SQL database query
          const favorites = await getUserFavoriteServersWithDetailsDirect();
          if (favorites.length > 0) {
            // Convert Date objects to strings to match the FavoriteServer interface
            const formattedFavorites = favorites.map(favorite => ({
              ...favorite,
              createdAt: favorite.createdAt instanceof Date ? favorite.createdAt.toISOString() : favorite.createdAt
            }));
            setFavoritesList(formattedFavorites as FavoriteServer[]);
          }
        } catch (error) {
          console.error('Error in direct fetch:', error);
        }
      }
    };
    
    fetchDirectly();
  }, [session]);

  // Use Tanstack Query to fetch favorite servers
  const { data: favorites = [], isLoading, refetch } = useQuery({
    queryKey: ['favoriteServers'],
    queryFn: async () => {
      const result = await getUserFavoriteServersWithDetails();
      // Convert Date objects to strings to match the FavoriteServer interface
      const formattedResult = result.map(item => ({
        ...item,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt
      }));
      setFavoritesList(formattedResult as FavoriteServer[]);
      return formattedResult as FavoriteServer[];
    },
    enabled: !!session, // Only run query if user is logged in
    staleTime: 10000, // 10 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
  
  // Refetch data on component mount
  React.useEffect(() => {
    if (session) {
      queryClient.invalidateQueries({ queryKey: ['favoriteServers'] });
      refetch();
    }
  }, [session, refetch, queryClient]);

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
        variant="outlined"
        className="shadow-sm"
      >
        <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </App>
    );
  }

  // Choose the data source
  const displayData = favorites.length > 0 ? favorites : favoritesList;

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
      variant="outlined"
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