import React, { useState } from 'react'
import { Button, Drawer, Table } from "antd"
import { SelectDrawing } from '@/db/schema'

const OpenDrawing = ({ children, drawingsAvailable, drawingSelected }: { children: React.ReactNode, drawingsAvailable: SelectDrawing[], drawingSelected: (id: number) => void }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Drawer
        title="Drawing"
        open={open}
        onClose={() => setOpen(false)}
        footer={null}
        placement="left"
        extra={
          <Button type="default" onClick={() => setOpen(false)}>Cancel</Button>
        }
        destroyOnClose
      >
        {drawingsAvailable && Array.isArray(drawingsAvailable) && (
          <Table
            columns={[
              {
                title: "Name",
                dataIndex: "name",
                
              },
            ]}
            dataSource={drawingsAvailable.map((drawing) => ({
              id: drawing.id,
              name: drawing.name,
              key: drawing.id,
            }))}
            rowKey="id"
            onRow={(record) => ({
              onClick: () => drawingSelected(record.id),
            })}
          />
        )}
      </Drawer>
    </>
  )
}

export default OpenDrawing