import React from 'react'
import { useQuery } from "@tanstack/react-query"
import { getProjectById } from "@/app/actions/projects/crudActions"
import { Col, Row } from 'antd'
import PrimaryEngineerList from './PrimaryEngineerList'
import PreviewDrawingsCard from './PreviewDrawingsCard'

const ProjectTab = ({ projectId }: { projectId: number }) => {
  const { data, error, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000
  })
  return (
    <>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {data && 
      <>
      <div className="text-gray-600 text-sm pb-2 mb-2 border-b border-gray-700">{data?.description}</div>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <PrimaryEngineerList projectId={projectId} />
        </Col>
        <Col span={12}>
          <PreviewDrawingsCard projectId={projectId} />
        </Col>
      </Row>
      </>
    }
    </>
  )
}

export default ProjectTab