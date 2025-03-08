import Link from 'next/link'
import React from 'react'

function ServerMenu() {
  return (
    <div>
      <p className='text-lg font-semibold'>Server</p>
      <div className='flex flex-col gap-2'>
        <Link href="/server/add">Add Server</Link>
        <Link href="/server/list">Manage Servers</Link>
      </div>
    </div>
  )
}

export default ServerMenu