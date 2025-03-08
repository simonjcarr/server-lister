import React from 'react'
import { SignIn, SignOut } from '@/app/components/auth/AuthButtons'
import { auth } from "@/auth"

async function SiteHeader() {
  const session = await auth()
  return (
    <div className='flex justify-between py-4 items-center'>
      <div className='text-lg font-semibold'>Server List</div>
      <div className='flex gap-2'>
        {session?.user ? <div><SignOut /></div> : <div><SignIn /></div>}
      </div>
    </div>
  )
}

export default SiteHeader