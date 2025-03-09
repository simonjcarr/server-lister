import React from 'react'
import { NavLink } from './NavDrawerLeft'

function ServerMenu() {
  return (
    <div>
      <p className='text-lg font-semibold'>Server</p>
      <div className='flex flex-col gap-2'>
        <NavLink href="/server/add">Add Server</NavLink>
        <NavLink href="/server/list">Manage Servers</NavLink>
      </div>
    </div>
  )
}

export default ServerMenu