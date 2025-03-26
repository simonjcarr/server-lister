'use client'
import { UserOutlined, LogoutOutlined, NotificationOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Space } from 'antd';
import { useSession, signOut } from 'next-auth/react';
import NotificationCountBadge from '../notifications/NotificationCountBadge';
import ViewNotificationsModal from '../notifications/ViewNotificationsModal';

// Renamed to uppercase and made it a proper React component
const NotificationMenuItem = () => {
  const { data: session } = useSession();
  if(!session?.user) {
    throw new Error('unauthorized')
  }
  return (
    <NotificationCountBadge>
      <ViewNotificationsModal>
        <div className='pr-2'>Notifications</div>
      </ViewNotificationsModal>
    </NotificationCountBadge>
  )
}

const handleMenuClick: MenuProps['onClick'] = (e) => {
  switch (e.key) {
    case '2':
      signOut();
      break;
  
    default:
      break;
  }
};

const items: MenuProps['items'] = [
  {
    label: <NotificationMenuItem />,
    key: '1',
    icon: <NotificationOutlined />,
  },
  {
    label: 'Logout',
    key: '2',
    icon: <LogoutOutlined />,
    onClick: () => signOut()
  },
];

const menuProps = {
  items,
  onClick: handleMenuClick,
};


function AuthMenu() {
  const { data: session } = useSession();
  return (
    <Space wrap>
      <NotificationCountBadge>
        <Dropdown.Button 
          data-testid="user-profile" 
          menu={menuProps} 
          placement="bottom" 
          icon={<UserOutlined />}
        >
          {session?.user?.email}
        </Dropdown.Button>
      </NotificationCountBadge>
    </Space>
  )
}

export default AuthMenu;