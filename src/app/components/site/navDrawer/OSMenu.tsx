import Link from 'next/link'
import React from 'react'

function OSMenu() {
  return (
    <div>
      <p className='text-lg font-semibold'>OS</p>
      <div className='flex flex-col gap-2'>
        <Link href="/os/add">Add OS</Link>
        <Link href="/os/list">Manage OS</Link>
      </div>
    </div>
  )
}

export default OSMenu