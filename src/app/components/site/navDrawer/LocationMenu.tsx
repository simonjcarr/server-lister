import Link from 'next/link'
import React from 'react'

function LocationMenu() {
  return (
    <div>
      <p className='text-lg font-semibold'>Location</p>
      <div className='flex flex-col gap-2'>
        <Link href="/location/add">Add Location</Link>
        <Link href="/location/list">Manage Locations</Link>
      </div>
    </div>
  )
}

export default LocationMenu