"use client";
import React, { Suspense, useState, useEffect } from 'react'
import { useParams, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import the NetworkGraph with no SSR to avoid DOM conflicts
const NetworkGraph = dynamic(
  () => import('@/app/components/project/networkGraph/NetworkGraph'),
  { ssr: false } // This is critical - prevents any server-side rendering of this component
)

const ProjectPage = () => {
  const { id } = useParams()
  const pathname = usePathname()
  const [graphKey, setGraphKey] = useState(0)
  
  // Reset graph when the route changes
  useEffect(() => {
    console.log('Project page mounted or path changed:', pathname)
    // Force remount of NetworkGraph when route changes
    setGraphKey(prevKey => prevKey + 1)
  }, [pathname])
  
  return (
    <div className="project-page" style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Project {id}</h1>
      <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', background: '#f5f5f5', border: '1px solid #ddd' }}>Loading network graph...</div>}>
        <NetworkGraph key={graphKey} />
      </Suspense>
    </div>
  )
}

export default ProjectPage