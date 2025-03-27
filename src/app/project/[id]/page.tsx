"use client";
import React, { Suspense, useState, useEffect } from 'react'
import { useParams, usePathname } from 'next/navigation'
import DrawIOEmbed from '@/app/components/project/drawio/DrawIO'

// Dynamically import the NetworkGraph with no SSR to avoid DOM conflicts


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
        <DrawIOEmbed onSave={() => {}} onLoad={() => {}} initialDiagramXml="" />
      </Suspense>
    </div>
  )
}

export default ProjectPage