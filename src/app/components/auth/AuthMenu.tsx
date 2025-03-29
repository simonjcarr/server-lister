'use client'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Space } from 'antd';
import { useSession, signOut } from 'next-auth/react';

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
      <Dropdown.Button 
        data-testid="user-profile" 
        menu={menuProps} 
        placement="bottom" 
        icon={<UserOutlined />}
      >
        {session?.user?.email}
      </Dropdown.Button>
    </Space>
  )
}

export default AuthMenu;