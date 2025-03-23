import React from 'react';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Space } from 'antd';
import { useSession, signOut } from 'next-auth/react';
import NotificationCountBadge from '../notifications/NotificationCountBadge';



const handleMenuClick: MenuProps['onClick'] = (e) => {
  switch (e.key) {
    case '1':
      signOut();
      break;
  
    default:
      break;
  }
};

const items: MenuProps['items'] = [
  {
    label: 'Logout',
    key: '1',
    icon: <LogoutOutlined />,
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
        <Dropdown.Button menu={menuProps} placement="bottom" icon={<UserOutlined />}>
          {session?.user?.email}
        </Dropdown.Button>
      </NotificationCountBadge>
    </Space>
  )
}


export default AuthMenu;