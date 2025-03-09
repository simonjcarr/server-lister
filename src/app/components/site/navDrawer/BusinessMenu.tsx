import React from 'react'
import { NavLink } from './NavDrawerLeft'

function BusinessMenu() {
  return (
    <div>
      <p className='text-lg font-semibold'>Business</p>
      <div className='flex flex-col gap-2'>
        <NavLink href="/business/add">Add Business</NavLink>
        <NavLink href="/business/list">Manage Businesses</NavLink>
      </div>
    </div>
  )
}

export default BusinessMenu
