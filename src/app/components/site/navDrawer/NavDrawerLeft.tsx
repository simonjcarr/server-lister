import React, { useState } from 'react';
import type { DrawerProps, RadioChangeEvent, MenuProps } from 'antd';
import { Button, Drawer, Radio, Space, Menu } from 'antd';
import Link from 'next/link';
import { FaMap, FaProjectDiagram, FaRegListAlt, FaRegObjectGroup, FaServer, FaTools, FaWindows } from 'react-icons/fa';
import { MdAddBox, MdNetworkPing } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { IoIosBusiness } from 'react-icons/io';
import { AiOutlineMenuUnfold } from 'react-icons/ai';


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

  const router = useRouter();
  type MenuItem = Required<MenuProps>['items'][number];
  const items: MenuItem[] = [
    {
      key: 'server',
      label: 'Server',
      icon: <FaServer />,
      children: [
        {
          key: 'server-add',
          label: 'Add Server',
          icon: <MdAddBox />,
          onClick: () => {
            router.push('/server/add');
          },
        },
        {
          key: 'server-list',
          label: 'Server List',
          icon: <FaRegListAlt />,
          onClick: () => {
            router.push('/');
          },
        },
        {
          key: 'os',
          label: 'Operating Systems',
          icon: <FaWindows />,
          children: [
            {
              key: 'os-add',
              label: 'Add OS',
              icon: <MdAddBox />,
              onClick: () => {
                router.push('/os/add');
              },
            },
            {
              key: 'os-list',
              label: 'OS List',
              icon: <FaRegListAlt />,
              onClick: () => {
                router.push('/os');
              },
            }
          ]
        },
        {
          key: 'server-groups',
          label: 'Server Groups',
          icon: <FaRegObjectGroup />,
          onClick: () => {
            router.push('/server/groups');
          },
        }

      ],
    },
    {
      key: 'location',
      label: 'Location',
      icon: <FaMap />,
      children: [
        {
          key: 'location-add',
          label: 'Add Location',
          icon: <MdAddBox />,
          onClick: () => {
            router.push('/location/add');
          },
        },
        {
          key: 'location-list',
          label: 'Location List',
          icon: <FaRegListAlt />,
          onClick: () => {
            router.push('/location');
          },
        }
      ],
    },
    {
      key: 'project',
      label: 'Project',
      icon: <FaProjectDiagram />,
      children: [
        {
          key: 'project-add',
          label: 'Add Project',
          icon: <MdAddBox />,
          onClick: () => {
            router.push('/project/add');
          },
        },
        {
          key: 'project-list',
          label: 'Project List',
          icon: <FaRegListAlt />,
          onClick: () => {
            router.push('/project');
          },
        }
      ],
    },
    {
      key: 'business',
      label: 'Business',
      icon: <IoIosBusiness />,
      children: [
        {
          key: 'business-add',
          label: 'Add Business',
          icon: <MdAddBox />,
          onClick: () => {
            router.push('/business/add');
          },
        },
        {
          key: 'business-list',
          label: 'Business List',
          icon: <FaRegListAlt />,
          onClick: () => {
            router.push('/business');
          },
        }
      ]
    },
    {
      key: 'utils',
      label: 'Utils',
      icon: <FaTools />,
      children: [
        {
          key: 'utils-ip-lookup',
          label: 'IP Lookup',
          icon: <MdNetworkPing />,
          onClick: () => {
            router.push('/utils/getip')
          }
        }
      ]
    }
  ]
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
          <AiOutlineMenuUnfold />
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
            <Menu
              style={{ width: 256 }}
              defaultSelectedKeys={['1']}
              defaultOpenKeys={['sub1']}
              mode="inline"
              items={items}
              onClick={onClose}
            />
          </div>
        </NavContext.Provider>
      </Drawer>
    </>
  );
};

export default App;