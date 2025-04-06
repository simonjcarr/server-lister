import React, { ReactNode, useState } from 'react';
import type { DrawerProps } from 'antd';
import { Button, Drawer, Space, Menu } from 'antd';
import Link from 'next/link';
import { FaCertificate, FaFileInvoiceDollar, FaMap, FaProjectDiagram, FaRegListAlt, FaRegObjectGroup, FaServer, FaTools, FaUsers, FaWindows, FaClipboardCheck } from 'react-icons/fa';
import { MdAddBox, MdAdminPanelSettings, MdNetworkPing } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { IoIosBusiness } from 'react-icons/io';
import { AiOutlineMenuUnfold } from 'react-icons/ai';
import { useSession } from 'next-auth/react';
import FormAddServer from '../../server/FormAddServer';
import FormAddLocation from '../../location/FormAddLocation';
import FormAddProject from '../../project/FormAddProject';
import FormAddBusiness from '../../business/FormAddBusiness';
import FormAddOS from '../../os/FormAddOS';

interface MyMenuItemConfig {
  key: string;
  className?: string;
  label: ReactNode; // Use ReactNode if labels can be more than just strings
  path?: string;     // Optional path for navigation links
  icon?: ReactNode;  // Optional icon
  "data-testid"?: string;   // Your required custom property for testing
  children?: MyMenuItemConfig[]; // Optional array of the same type for submenus
  onClick?: () => void; // Optional click handler
}

// Create a NavContext to share the onClose function
export const NavContext = React.createContext<{ onClose: () => void }>({ onClose: () => { } });

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
  // type MenuItem = Required<MenuProps>['items'][number];
  const items: MyMenuItemConfig[] = [
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
            router.push('/server/list');
          },
        },
        {
          key: 'os',
          label: 'Operating Systems',
          icon: <FaWindows />,
          children: [
            {
              key: 'os-add',
              label: <FormAddOS><div>Add OS</div></FormAddOS>,
              icon: <MdAddBox />,

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
        },
        {
          key: 'server-favorites',
          label: 'Favourite Servers',
          icon: <FaRegListAlt />,
          onClick: () => {
            router.push('/server/favourites');
          },
        }

      ],
    },
    {
      key: 'whitelist',
      label: 'Software Whitelist',
      icon: <FaClipboardCheck />,
      onClick: () => {
        router.push('/whitelist');
      },
    },
    {
      key: 'location',
      label: 'Location',
      "data-testid": 'test-left-menu-location',
      icon: <FaMap />,
      children: [
        {
          key: 'location-add',
          "data-testid": 'test-left-menu-location-add',
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
            router.push('/project/list');
          },
        },
        {
          key: 'booking-codes',
          label: 'Booking Codes',
          icon: <FaRegListAlt />,
          onClick: () => {
            router.push('/project/booking-codes');
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
          label: <FormAddBusiness><div>Add Business</div></FormAddBusiness>,
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
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: <FaFileInvoiceDollar />,
      onClick: () => {
        router.push('/reports');
      },
    },
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: <FaRegListAlt />,
      onClick: () => {
        router.push('/');
      },
    }
  ]
  if (session?.user?.roles?.includes('admin')) {
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
  const [open, setOpen] = useState(false);
  const [placement] = useState<DrawerProps['placement']>('left');

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
          <AiOutlineMenuUnfold data-testid="nav-drawer-button" />
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