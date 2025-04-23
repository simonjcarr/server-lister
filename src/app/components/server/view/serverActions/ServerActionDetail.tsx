import React from 'react'
import type { ServerAction } from "@/types"
import clickToCopy from "@/app/components/utils/ClickToCopy"
import DistanceToNow from '@/app/components/utils/DistanceToNow'
const ServerActionDetail = ({ action }: { action: ServerAction }) => {
  return (
    <>
      <div className='flex'><span className='font-semibold mr-2'>Created by:</span> {action.userName} {action.userEmail && <span className="ml-1 flex">({clickToCopy({text: action.userEmail})})</span>}</div>
      <div className='flex'><span className='font-semibold mr-2'>Created:</span> <span className=''>{DistanceToNow({ date: action.createdAt })}</span></div>
      {action.description ? (
        <>
          <div className='font-semibold'>Description:</div>
          <div style={{ whiteSpace: 'pre-line' }} className="max-h-25 overflow-y-scroll p-2 bg-gray-800 rounded">{action.description}</div>
        </>
      )
      : (<div>No Description</div>)
      }
    </>
  )
}

export default ServerActionDetail