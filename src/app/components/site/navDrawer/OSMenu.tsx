import React from 'react'
import { NavLink } from './NavDrawerLeft'

function OSMenu() {
  return (
    <div>
      <p className='text-lg font-semibold'>OS</p>
      <div className='flex flex-col gap-2'>
        <NavLink href="/os/add">Add OS</NavLink>
        <NavLink href="/os/list">Manage OS</NavLink>
      </div>
    </div>
  )
}

export default OSMenu