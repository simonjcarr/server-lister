import React from 'react';
import FormAddProject from '@/app/components/project/FormAddProject';
import { Button } from 'antd';

export default function AddProjectPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Add Project</h1>
      <FormAddProject>
        <Button type="primary">Add New Project</Button>
      </FormAddProject>
    </div>
  );
}