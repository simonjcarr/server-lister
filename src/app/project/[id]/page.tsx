"use client";
import React from 'react'
import { useParams } from 'next/navigation'

const ProjectPage = () => {
  const { id } = useParams()
  return (
    <>
      <div>Project {id}</div>
    </>
  )
}

export default ProjectPage