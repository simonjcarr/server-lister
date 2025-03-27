import { useQuery } from "@tanstack/react-query"
import { getProjects } from "@/app/actions/projects/crudActions"
import type { ProjectData } from "@/app/actions/projects/crudActions"
import { Drawer, Input, Table } from "antd"
import { SearchOutlined } from '@ant-design/icons';
import { useState } from "react"
import { useRouter } from "next/navigation"

const ProjectList = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const router = useRouter()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects
  })
  

  return (
    <div>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Drawer
        title="Projects"
        placement="left"
        open={open}
        onClose={() => setOpen(false)}
        footer={null}
      >
        {isLoading && <p>Loading...</p>}
        {isError && <p>Error loading projects</p>}
        {data && (
          <>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mb-4"
          />
          <Table
          onRow={(record: ProjectData) => ({
            onClick: () => {
              setOpen(false)
              router.push(`/project/${record.id}`)
            }
          })}
          rowKey="id"
          columns={[
            {
              title: 'Name',
              dataIndex: 'name',
              key: 'name',
              sorter: (a: ProjectData, b: ProjectData) => a.name.localeCompare(b.name)
            },
            {
              title: 'Business',
              dataIndex: 'businessName',
              key: 'business',
              sorter: (a: ProjectData, b: ProjectData) => (a.businessName || '').localeCompare(b.businessName || '')
            },
            {
              title: 'Code',
              dataIndex: 'code',
              key: 'code',
            },
          ]}
          dataSource={data.filter((project) => project.name.toLowerCase().includes(filter.toLowerCase() || (project.businessName || '').toLowerCase() || '') || (project.code || '').toLowerCase().includes(filter.toLowerCase()))}
        />
        </>
        )}
      </Drawer>
    </div>
  )
}

export default ProjectList