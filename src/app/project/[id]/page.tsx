"use client";
// import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ViewProject from '@/app/components/project/ViewProject';
import { App } from 'antd';

// Dynamically import the NetworkGraph with no SSR to avoid DOM conflicts


const ProjectPage = () => {
  const { id } = useParams()
  
  return (
    <div className="project-page">
      <App>
        <ViewProject projectId={Number(id)} />
      </App>
    </div>
  )
}

export default ProjectPage