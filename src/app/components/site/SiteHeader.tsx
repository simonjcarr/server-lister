'use client';

import React from 'react'
import { SignIn } from '@/app/components/auth/AuthButtons'
import { useTheme } from '@/app/theme/ThemeProvider';
import { Button } from 'antd';
import { Moon, Sun } from 'lucide-react';
import { useSession } from 'next-auth/react';
import NavDrawerLeft from './navDrawer/NavDrawerLeft';
import Link from 'next/link';
import AuthMenu from '../auth/AuthMenu';
import NotificationList from '../notifications/NotificationList';
import GlobalEngineerHoursButton from '../server/view/engineerHours/GlobalEngineerHoursButton';

export function SiteHeader() {
  const { data: session } = useSession();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className='flex justify-between py-4 items-center'>
      <div className='flex gap-2 items-center'>
        <Link href="/" className='text-2xl font-semibold dark:text-gray-200'>IMS</Link>
        <NavDrawerLeft />
      </div>
      <div className='flex gap-2'>
        <Button
          onClick={toggleTheme}
          icon={isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
        />
        {session?.user && <GlobalEngineerHoursButton />}
        {session?.user && <NotificationList />}
        {session?.user ? <div><AuthMenu /></div> : <div><SignIn /></div>}
      </div>
    </div>
  )
}