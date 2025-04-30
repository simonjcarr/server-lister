import React from 'react'
import type { ServerTask } from "@/types"
import clickToCopy from "@/app/components/utils/ClickToCopy"
import DistanceToNow from '@/app/components/utils/DistanceToNow'
const ServerTaskDetail = ({ task }: { task: ServerTask }) => {
  return (
    <>
      <div className='flex'><span className='font-semibold mr-2'>Created by:</span> {task.userName} {task.userEmail && <span className="ml-1 flex">({clickToCopy({text: task.userEmail})})</span>}</div>
      <div className='flex'><span className='font-semibold mr-2'>Created:</span> <span className=''>{DistanceToNow({ date: task.createdAt })}</span></div>
      {task.description ? (
        <>
          <div className='font-semibold'>Description:</div>
          <div style={{ whiteSpace: 'pre-line' }} className="max-h-25 overflow-y-scroll p-2 bg-gray-800 rounded">{task.description}</div>
        </>
      )
      : (<div className='text-gray-400 mt-2'>No Description</div>)
      }
    </>
  )
}

export default ServerTaskDetail