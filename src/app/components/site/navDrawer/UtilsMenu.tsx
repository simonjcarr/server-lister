import Link from 'next/link'
import React from 'react'

function UtilsMenu() {
  return (
    <div>
      <p className='text-lg font-semibold'>Utils</p>
      <div className='flex flex-col gap-2'>
        <Link href="/utils/getip">IP Lookup</Link>
      </div>
    </div>
  )
}

export default UtilsMenu