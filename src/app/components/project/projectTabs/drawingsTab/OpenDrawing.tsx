import React, { useState } from 'react'
import { useQuery } from "@tanstack/react-query"
import { getProjectDrawings } from "@/app/actions/projects/crudActions"
import { Button, Drawer, Table } from "antd"

const OpenDrawing = ({ children, projectId, drawingSelected }: { children: React.ReactNode, projectId: number, drawingSelected: (id: number) => void }) => {
  const [open, setOpen] = useState(false)
  const { data, error, isLoading } = useQuery({
    queryKey: ["projectDrawing", projectId],
    queryFn: () => getProjectDrawings(projectId),
    staleTime: 60 * 1000
  })
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
        {isLoading && <div>Loading...</div>}
        {error && <div>{error instanceof Error ? error.message : 'Failed to fetch drawing'}</div>}
        {data && Array.isArray(data) && (
          <Table
            columns={[
              {
                title: "Name",
                dataIndex: "name",
                
              },
            ]}
            dataSource={data.map((drawing) => ({
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