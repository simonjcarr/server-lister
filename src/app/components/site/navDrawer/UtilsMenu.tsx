import React from 'react'
import { NavLink } from './NavDrawerLeft'

function UtilsMenu() {
  return (
    <div>
      <p className='text-lg font-semibold'>Utils</p>
      <div className='flex flex-col gap-2'>
        <NavLink href="/utils/getip">IP Lookup</NavLink>
      </div>
    </div>
  )
}

export default UtilsMenu