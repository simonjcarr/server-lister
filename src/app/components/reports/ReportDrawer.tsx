'use client'
import { Drawer } from 'antd';
import { useState } from 'react';
import ReportsList from './ReportsList';
const ReportDrawer = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
    <span onClick={() => setOpen(true)}>{children}</span>
    <Drawer title="Reports" placement="left" onClose={() => setOpen(false)} open={open}>
      <ReportsList />
    </Drawer>
    </>
  )
}

export default ReportDrawer