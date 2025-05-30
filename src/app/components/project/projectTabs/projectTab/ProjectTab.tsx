import React from 'react'
import { useQuery } from "@tanstack/react-query"
import { getProjectById } from "@/app/actions/projects/crudActions"
import { Col, Row, Divider, Tabs, Card } from 'antd'
import PrimaryEngineerList from './PrimaryEngineerList'
import PreviewDrawingsCard from './PreviewDrawingsCard'
import ProjectServers from './ProjectServers'
import { EngineerHoursSummary } from '@/app/components/server/view/engineerHours'
import ProjectEngineerHoursMatrix from '../engineerHours/ProjectEngineerHoursMatrix'

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
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={12}>
          <PrimaryEngineerList projectId={projectId} />
        </Col>
        <Col span={12}>
          <PreviewDrawingsCard projectId={projectId} />
        </Col>
      </Row>
      
      <Row className="mb-6">
        <Col span={24}>
          <Card title="Engineer Hours" className="mb-4">
            <Tabs
              defaultActiveKey="chart"
              items={[
                {
                  key: 'chart',
                  label: 'Chart View',
                  children: (
                    <EngineerHoursSummary 
                      summaryType="project" 
                      entityId={projectId} 
                      title={`Hours Summary - ${data.name}`}
                      compactMode={false}
                      defaultTimeRange="month"
                      defaultChartType="cumulative"
                    />
                  ),
                },
                {
                  key: 'matrix',
                  label: 'Matrix View',
                  children: (
                    <ProjectEngineerHoursMatrix 
                      projectId={projectId} 
                    />
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
      
      <Divider orientation="left" plain>Infrastructure</Divider>
      <ProjectServers projectId={projectId} />
      </>
    }
    </>
  )
}

export default ProjectTab