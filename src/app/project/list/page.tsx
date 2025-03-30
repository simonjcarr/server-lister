'use client';

import { Typography, Card, Button, App } from "antd";
import { PlusOutlined } from '@ant-design/icons';
import FormAddProject from "@/app/components/project/FormAddProject";
import ProjectList from "@/app/components/project/ProjectList";

const { Title } = Typography;

export default function ProjectListPage() {
  return (
    <div className="p-4">
      <App>
        <Card>
          <div className="flex flex-row justify-between items-center mb-6">
            <Title level={2}>Projects</Title>
            <FormAddProject>
              <Button type="primary" icon={<PlusOutlined />}>
                Add Project
              </Button>
            </FormAddProject>
          </div>
          
          <ProjectList />
        </Card>
      </App>
    </div>
  );
}