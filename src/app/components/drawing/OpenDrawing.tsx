import React, { useState } from 'react'
import { Button, Drawer, Table } from "antd"
import { SelectDrawing } from '@/db/schema'

const OpenDrawing = ({ children, drawingsAvailable, drawingSelected }: { children: React.ReactNode, drawingsAvailable: SelectDrawing[], drawingSelected: (id: number) => void }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Drawer
        title="Drawings"
        width={600}
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
                title: "Title",
                dataIndex: "name",
                sorter: (a, b) => a.name.localeCompare(b.name),
                defaultSortOrder: 'ascend',
              },
            ]}
            dataSource={drawingsAvailable.map((drawing) => ({
              id: drawing.id,
              name: drawing.name,
              key: drawing.id,
            }))}
            rowKey="id"
            size='small'
            onRow={(record) => ({
              onClick: () => { drawingSelected(record.id); setOpen(false) },
            })}
            rowClassName={() => 'cursor-pointer'}
          />
        )}
      </Drawer>
    </>
  )
}

export default OpenDrawing