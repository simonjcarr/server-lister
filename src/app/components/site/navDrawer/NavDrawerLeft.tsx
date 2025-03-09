import React, { useState } from 'react';
import type { DrawerProps, RadioChangeEvent } from 'antd';
import { Button, Drawer, Radio, Space } from 'antd';
import { Menu } from 'lucide-react';
import ServerMenu from './ServerMenu';
import UtilsMenu from './UtilsMenu';
import LocationMenu from './LocationMenu';
import OSMenu from './OSMenu';

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
        <div className='flex flex-col gap-2'>
          <ServerMenu />
          <LocationMenu />
          <OSMenu />
          <UtilsMenu />
          
        </div>
      </Drawer>
    </>
  );
};

export default App;