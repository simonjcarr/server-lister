import React from 'react';
import { DownOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown, message, Space, Tooltip } from 'antd';
import { useSession, signOut } from 'next-auth/react';


const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  message.info('Click on left button.');
  console.log('click left button', e);
};

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
      <Dropdown.Button menu={menuProps} placement="bottom" icon={<UserOutlined />}>
        {session?.user?.email}
      </Dropdown.Button>
    </Space>
  )
}


export default AuthMenu;