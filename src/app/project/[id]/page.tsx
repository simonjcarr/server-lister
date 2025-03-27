"use client";
import React, { Suspense } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import the NetworkGraph with no SSR to avoid DOM conflicts
const NetworkGraph = dynamic(
  () => import('@/app/components/project/networkGraph/NetworkGraph'),
  { ssr: false } // This is critical - prevents any server-side rendering of this component
)

const ProjectPage = () => {
  const { id } = useParams()
  return (
    <>
      <div>Project {id}</div>
      <Suspense fallback={<div>Loading network graph...</div>}>
        <NetworkGraph />
      </Suspense>
    </>
  )
}

export default ProjectPage