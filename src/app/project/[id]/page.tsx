"use client";
import React, { Suspense, useState, useEffect } from 'react'
import { useParams, usePathname } from 'next/navigation'
import DrawIOEmbed from '@/app/components/project/drawio/DrawIO'
import ViewProject from '@/app/components/project/ViewProject';

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
    <div className="project-page" >
        {/* <DrawIOEmbed onSave={() => {}} onLoad={() => {}} initialDiagramXml="" /> */}
        <ViewProject projectId={Number(id)} />
      
    </div>
  )
}

export default ProjectPage