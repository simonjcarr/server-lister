import React from 'react'
import { SignIn, SignOut } from '@/app/components/auth/AuthButtons'

function Header() {
  return (
    <div className='flex justify-between px-4 py-4'>
      <div className='text-lg font-semibold'>Server List</div>
      <div className='flex gap-2'>
        <div><SignIn /></div>
        <div><SignOut /></div>
      </div>
    </div>
  )
}

export default Header