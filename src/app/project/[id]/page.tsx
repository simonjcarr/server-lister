"use client";
// import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ViewProject from '@/app/components/project/ViewProject';
import { App } from 'antd';

// Dynamically import the NetworkGraph with no SSR to avoid DOM conflicts


const ProjectPage = () => {
  const { id } = useParams()
  // const pathname = usePathname()
  // const [graphKey, setGraphKey] = useState(0)
  
  // Reset graph when the route changes
  // useEffect(() => {
  //   console.log('Project page mounted or path changed:', pathname)
  //   // Force remount of NetworkGraph when route changes
  //   setGraphKey(prevKey => prevKey + 1)
  // }, [pathname])
  
  return (
    <div className="project-page">
      {/* <DrawIOEmbed onSave={() => {}} onLoad={() => {}} initialDiagramXml="" /> */}
      <App>
        <ViewProject projectId={Number(id)} />
      </App>
    </div>
  )
}

export default ProjectPage