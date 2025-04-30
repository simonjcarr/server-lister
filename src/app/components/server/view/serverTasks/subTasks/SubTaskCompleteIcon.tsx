'use client'
import React from 'react'
import { SubTask } from '@/types'
import { FaRegCircle, FaRegCircleCheck } from 'react-icons/fa6'

const SubTaskCompleteIcon = ({ subTask }: { subTask: SubTask }) => {
  return (
    <>
      {subTask.isComplete ? <FaRegCircleCheck className="text-green-500" /> : <FaRegCircle />}
    </>
  )
}

export default SubTaskCompleteIcon