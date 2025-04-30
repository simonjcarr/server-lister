import { SubTask } from '@/types'
import React from 'react'

const DisplaySubTaskDetail = ({ subTask }: { subTask: SubTask }) => {
  return (
    <div className='px-4'>
      
      <div className="text-xl font-bold">{subTask.title}</div>
      <div>{subTask.description}</div>
    </div>
  )
}

export default DisplaySubTaskDetail