import React from 'react'
import { NavLink } from './NavDrawerLeft'

function LocationMenu() {
  return (
    <div>
      <p className='text-lg font-semibold'>Location</p>
      <div className='flex flex-col gap-2'>
        <NavLink href="/location/add">Add Location</NavLink>
        <NavLink href="/location/list">Manage Locations</NavLink>
      </div>
    </div>
  )
}

export default LocationMenu