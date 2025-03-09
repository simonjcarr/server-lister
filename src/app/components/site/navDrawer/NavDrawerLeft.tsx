import React, { useState } from 'react';
import type { DrawerProps, RadioChangeEvent } from 'antd';
import { Button, Drawer, Radio, Space } from 'antd';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import ServerMenu from './ServerMenu';
import UtilsMenu from './UtilsMenu';
import LocationMenu from './LocationMenu';
import OSMenu from './OSMenu';
import ProjectMenu from './ProjectMenu';
import BusinessMenu from './BusinessMenu';

// Create a NavContext to share the onClose function
export const NavContext = React.createContext<{ onClose: () => void }>({ onClose: () => {} });

// Create a NavLink component that closes the drawer when clicked
export const NavLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
  const { onClose } = React.useContext(NavContext);
  
  return (
    <Link href={href} onClick={onClose}>
      {children}
    </Link>
  );
};

const App: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<DrawerProps['placement']>('left');

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const onChange = (e: RadioChangeEvent) => {
    setPlacement(e.target.value);
  };

  return (
    <>
      <Space>
        
        <Button type="primary" size='small' onClick={showDrawer}>
          <Menu />
        </Button>
      </Space>
      <Drawer
        title="Menu"
        placement={placement}
        closable={false}
        onClose={onClose}
        open={open}
        key={placement}
      >
        <NavContext.Provider value={{ onClose }}>
          <div className='flex flex-col gap-2'>
            <ServerMenu />
            <LocationMenu />
            <ProjectMenu />
            <BusinessMenu />
            <OSMenu />
            <UtilsMenu />
          </div>
        </NavContext.Provider>
      </Drawer>
    </>
  );
};

export default App;