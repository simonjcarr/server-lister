import React from 'react'
import { NavLink } from './NavDrawerLeft'

function ProjectMenu() {
  return (
    <div>
      <p className='text-lg font-semibold'>Project</p>
      <div className='flex flex-col gap-2'>
        <NavLink href="/project/add">Add Project</NavLink>
        <NavLink href="/project/list">Manage Projects</NavLink>
      </div>
    </div>
  )
}

export default ProjectMenu