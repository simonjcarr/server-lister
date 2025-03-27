"use client";
import React from 'react'
import { useParams } from 'next/navigation'
import NetworkGraph from '@/app/components/project/networkGraph/NetworkGraph'

const ProjectPage = () => {
  const { id } = useParams()
  return (
    <>
      <div>Project {id}</div>
      <NetworkGraph />
    </>
  )
}

export default ProjectPage