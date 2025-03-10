'use client';

import React from 'react'
import { SignIn, SignOut } from '@/app/components/auth/AuthButtons'
import { useTheme } from '@/app/theme/ThemeProvider';
import { Button } from 'antd';
import { Moon, Sun } from 'lucide-react';
import { useSession } from 'next-auth/react';
import NavDrawerLeft from './navDrawer/NavDrawerLeft';
import Link from 'next/link';
import AuthMenu from '../auth/AuthMenu';

export function SiteHeader() {
  const { data: session } = useSession();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className='flex justify-between py-4 items-center'>
      <div className='flex gap-2 items-center'>
        <Link href="/" className='text-2xl font-semibold dark:text-gray-200'>Server List</Link>
        <NavDrawerLeft />
      </div>
      <div className='flex gap-2'>

      <Button
        onClick={toggleTheme}
        icon={isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
      />
        {session?.user ? <div><AuthMenu /></div> : <div><SignIn /></div>}
      
      </div>
    </div>
  )
}