import React, { useState } from 'react';
import type { DrawerProps, MenuProps } from 'antd';
import { Button, Drawer, Space, Menu } from 'antd';
import Link from 'next/link';
import { FaCertificate, FaMap, FaProjectDiagram, FaRegListAlt, FaRegObjectGroup, FaServer, FaTools, FaUsers, FaWindows } from 'react-icons/fa';
import { MdAddBox, MdAdminPanelSettings, MdNetworkPing } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { IoIosBusiness } from 'react-icons/io';
import { AiOutlineMenuUnfold } from 'react-icons/ai';
import { useSession } from 'next-auth/react';
import FormAddServer from '../../server/FormAddServer';
import FormAddLocation from '../../location/FormAddLocation';
import FormAddProject from '../../project/FormAddProject';



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
  const { data: session } = useSession();
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
          label: <FormAddServer><div>Add Server</div></FormAddServer>,
          icon: <MdAddBox />,
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
          key: 'server-collections',
          label: 'Server Collections',
          icon: <FaRegObjectGroup />,
          onClick: () => {
            router.push('/server/collections');
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
          label: <FormAddLocation><div>Add Location</div></FormAddLocation>,
          icon: <MdAddBox />,
          
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
          label: <FormAddProject><div>Add Project</div></FormAddProject>,
          icon: <MdAddBox />,
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
    },
    {
      key: 'certs',
      label: 'Certificates',
      icon: <FaCertificate />,
      children: [
        {
          key: 'certs-list',
          label: 'Manage Certificates',
          icon: <FaRegListAlt />,
          onClick: () => {
            router.push('/certs');
          },
        }
      ]
    }
  ]
  if(session?.user?.roles?.includes('admin')) {
    items.unshift({
      key: 'admin',
      label: 'Admin',
      icon: <MdAdminPanelSettings />,
      children: [
        {
          key: 'admin-projects',
          label: 'Projects',
          icon: <FaProjectDiagram />,
          onClick: () => {
            router.push('/admin/projects');
          },
        },
        {
          key: 'admin-business',
          label: 'Business',
          icon: <IoIosBusiness />,
          onClick: () => {
            router.push('/admin/business');
          },
        },
        {
          key: 'admin-locations',
          label: 'Locations',
          icon: <FaMap />,
          onClick: () => {
            router.push('/admin/locations');
          },
        },
        {
          key: 'admin-servers',
          label: 'Servers',
          icon: <FaServer />,
          onClick: () => {
            router.push('/admin/servers');
          },
        },
        {
          key: 'admin-users',
          label: 'Users',
          icon: <FaUsers />,
          onClick: () => {
            router.push('/admin/users');
          },
        },
      ],
    })
  }
  const [ open, setOpen] = useState(false);
  const [ placement ] = useState<DrawerProps['placement']>('left');

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
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